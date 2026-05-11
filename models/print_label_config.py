from odoo import fields, models, api

class PrintLabelConfig(models.Model):
    _name = "print.label.config"
    _description = "Configuracion de PrintLabel para cada compañia"
    _rec_name = "company_id"

    company_id = fields.Many2one(
        "res.company",
        string="Compañia",
        required=True,
        default=lambda self: self.env.company,
        ondelete="cascade"
    )

    pricelist = fields.Many2one(
        'product.pricelist',
        string="Lista de Precio"
    )

    template_id = fields.Many2one(
        'print.label.template',
        string="Plantilla de Etiqueta",
        domain="[('company_id', '=', company_id)]"
    )