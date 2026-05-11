from odoo import models, fields


class PrintLabelTemplate(models.Model):
    _name = "print.label.template"
    _description = "Plantilla de etiqueta para impresión"
    _order = "write_date desc"

    name = fields.Char(string="Nombre", required=True)
    json_data = fields.Text(string="JSON del diseño", required=True)
    company_id = fields.Many2one(
        "res.company",
        string="Compañía",
        default=lambda self: self.env.company,
        required=True,
    )
