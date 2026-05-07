from odoo import models, api
import json, math, logging

_logger = logging.getLogger(__name__)

FIELD_TYPE_MAP = {
    'char': 'text',
    'text': 'text',
    'html': 'text',
    'integer': 'text',
    'float': 'text',
    'monetary': 'text',
    'many2one': 'text',
    'selection': 'text',
    'boolean': 'text',
}

# Campos que saldran en la etiqueta
TEMPLATE_FIELDS = {
    'id', 'name', 'barcode', 'default_code', 'type', 'list_price',
    'variants_default_code', 'categ_id', 'avg_cost', 'qty_available'
}


class OmePrintLabel(models.Model):
    _name = "ome.print.label"

    @api.model
    def get_product_fields(self):
        """Devuelve los campos de product.template aptos para etiquetas."""
        ProductTemplate = self.env['product.template']
        fields_info = ProductTemplate.fields_get()
        product_sample = ProductTemplate.search([], limit=1)
        result = []
        for name, meta in fields_info.items():
            if name.startswith('_') or not (name in TEMPLATE_FIELDS):
                continue
            ttype = meta.get('type', '')
            mapped = FIELD_TYPE_MAP.get(ttype)
            if not mapped:
                continue
            label = meta.get('string', name)
            field_type = 'barcode' if name == 'barcode' else mapped

            result.append({
                'key': name,
                'label': label,
                'type': field_type,
                'placeholder': self._get_attr(product_sample, name, meta) if product_sample else '',
            })
        # Campo custom precio mayorista
        result.append({
            'key': 'codeWholesalePrice',
            'label': 'Código Precio Mayorista',
            'type': 'text',
            'placeholder': '0/00'
        })
        result.sort(key=lambda f: f['label'])
        return result

    def _get_attr(self, product, name, meta):
        data = product.read([name])[0]
        value = data.get(name)
        ttype = meta.get('type')

        if ttype == 'many2one':
            value = value[1] if value else ''

        elif ttype in ('many2many', 'one2many'):
            value = ', '.join(v[1] for v in value) if value else ''

        elif ttype == 'boolean':
            value = 'Sí' if value else 'No'

        elif ttype in ('binary', 'html', 'properties'):
            value = ''

        elif value in (False, None):
            value = ''

        else:
            value = str(value)
        
        return value

    @api.model
    def _get_config(self):
        company = self.env.company

        config = self.env["print.label.config"].search(
            [("company_id", "=", company.id)], limit=1
        )

        if not config:
            config = self.env["print.label.config"].create({
                "company_id": company.id
            })

        return config

    @api.model
    def _get_default_template(self):
        """Plantilla de fallback cuando la compañía no tiene una configurada."""
        return self.env.ref(
            'print_label.default_label_template',
            raise_if_not_found=False,
        )

    @api.model
    def get_config_data(self):
        config = self._get_config()
        template = config.template_id or self._get_default_template()
        return {
            "id": config.id,
            "template_id": template.id if template else False,
            "pricelist_id": config.pricelist.id if config.pricelist else False,
        }
    
    @api.model
    def load_productlist(self, search_term='', page=1, page_size=10):
        ProductTemplate = self.env['product.template']
        PricelistItem = self.env['product.pricelist.item']
        config = self._get_config()
        
        domain = []
        if search_term:
            domain = [
                '|', '|',
                ('name', 'ilike', search_term),
                ('default_code', 'ilike', search_term),
                ('categ_id.name', 'ilike', search_term)
            ]
        
        offset = (page - 1) * page_size
        
        total = ProductTemplate.search_count(domain)
        products = ProductTemplate.search(
            domain,
            offset=offset,
            limit=page_size
        )
        
        # Campos dinámicos de product.template aptos para etiquetas
        fields_info = ProductTemplate.fields_get()
        label_fields = [
            name for name, meta in fields_info.items()
            if not name.startswith('_')
            and name in TEMPLATE_FIELDS
            and meta.get('type', '') in FIELD_TYPE_MAP
        ]

        product_list = []
        for product in products:
            pricelist_item = PricelistItem.search([
                ('pricelist_id', '=', config.pricelist.id),
                ('product_tmpl_id', '=', product.id)
            ], limit=1)

            wholesale_code = ''
            if pricelist_item:
                wholesale_code = self._calculate_code(pricelist_item, product)

            data = {'id': product.id, 'codeWholesalePrice': wholesale_code}
            for fname in label_fields:
                value = product[fname]
                ftype = fields_info[fname]['type']
                if ftype == 'many2one':
                    data[fname] = value.display_name if value else ''
                elif ftype == 'boolean':
                    data[fname] = value
                elif ftype == 'selection':
                    # Obtener el label legible de la selección
                    data[fname] = dict(
                        fields_info[fname].get('selection', [])
                    ).get(value, value or '')
                else:
                    data[fname] = value if value else ''
            data['image_128'] = product.image_128
            product_list.append(data)
        
        return {
            'products': product_list,
            'total': total,
            'current_page': page,
            'page_size': page_size,
            'total_pages': math.ceil(total / page_size) if page_size > 0 else 0
        }
    
    # ================= TEMPLATE CRUD =================

    @api.model
    def get_templates(self):
        default = self._get_default_template()
        domain = [("company_id", "=", self.env.company.id)]
        if default:
            domain = ['|', ('id', '=', default.id)] + domain
        templates = self.env["print.label.template"].search(domain)
        return [
            {"id": t.id, "name": t.name, "write_date": str(t.write_date)}
            for t in templates
        ]

    @api.model
    def save_template(self, name, json_data):
        template = self.env["print.label.template"].create(
            {
                "name": name,
                "json_data": json_data if isinstance(json_data, str) else json.dumps(json_data),
                "company_id": self.env.company.id,
            }
        )
        return {"id": template.id, "name": template.name}

    @api.model
    def load_template(self, template_id):
        template = self.env["print.label.template"].browse(template_id)
        if not template.exists():
            return False
        return {
            "id": template.id,
            "name": template.name,
            "json_data": template.json_data,
        }

    @api.model
    def update_template(self, template_id, vals):
        template = self.env["print.label.template"].browse(template_id)
        if not template.exists():
            return False
        write_vals = {}
        if "name" in vals:
            write_vals["name"] = vals["name"]
        if "json_data" in vals:
            data = vals["json_data"]
            write_vals["json_data"] = data if isinstance(data, str) else json.dumps(data)
        template.write(write_vals)
        return {"id": template.id, "name": template.name}

    @api.model
    def delete_template(self, template_id):
        template = self.env["print.label.template"].browse(template_id)
        if template.exists():
            template.unlink()
        return True

    def _calculate_code(self, pricelist_item, product=None, partner=None):
        if not product:
            return '0/00'

        pricelist = pricelist_item.pricelist_id

        price = pricelist._get_product_price(
            product,
            quantity=3,
            partner=partner or False
        )

        if not price:
            return '0/00'

        letter_map = {
            1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E',
            6: 'F', 7: 'G', 8: 'H', 9: 'I', 10: 'J'
        }

        integer_part = int(price)
        decimal_part = round((price - integer_part) * 100)

        code = ''

        if integer_part == 0:
            code = '0'
        else:
            dec = integer_part // 10
            unit = integer_part % 10

            if dec > 0:
                code += str(dec)
                code += letter_map[10]

            if unit > 0:
                code += letter_map.get(unit, str(unit))

        return f"{code}/{str(decimal_part).zfill(2)}"