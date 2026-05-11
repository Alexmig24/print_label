from odoo import models, fields


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    print_label_pricelist = fields.Many2one(
        'product.pricelist',
        string="Lista de Precio para Etiquetas"
    )

    print_label_template_id = fields.Many2one(
        'print.label.template',
        string="Plantilla de Etiquetas"
    )

    def _get_print_label_config(self):
        company = self.env.company
        config = self.env["print.label.config"].search(
            [("company_id", "=", company.id)], limit=1
        )
        if not config:
            config = self.env["print.label.config"].create({
                "company_id": company.id
            })
        return config

    def get_values(self):
        res = super().get_values()
        config = self._get_print_label_config()

        res.update({
            "print_label_pricelist": config.pricelist.id,
            "print_label_template_id": config.template_id.id,
        })
        return res

    def set_values(self):
        super().set_values()
        config = self._get_print_label_config()

        config.write({
            "pricelist": self.print_label_pricelist.id,
            "template_id": self.print_label_template_id.id,
        })