/** @odoo-module **/

export async function generatePdf() {
    if (Object.values(this.state.productSelected).length === 0) {
        this.notification.add('Por favor selecciona al menos un producto', { type: 'warning' });
        return;
    }

    if (!this.state.templateId) {
        this.notification.add('Por favor selecciona una plantilla, Configuracion/Inventario/Imprimir Etiquetas', { type: 'warning' });
        return;
    }

    if (!window.jspdf) {
        console.error('window.jspdf is undefined');
        return;
    }
    if (typeof JsBarcode === 'undefined') {
        console.error('JsBarcode is undefined');
        return;
    }

    this.state.generatingPdf = true;

    try {
        const result = await this.orm.call('ome.print.label', 'load_template', [this.state.templateId]);
        if (!result) {
            this.notification.add('No se pudo cargar la plantilla', { type: 'danger' });
            return;
        }
        const template = JSON.parse(result.json_data);

        const { jsPDF } = window.jspdf;

        const pageWidth = 111;
        const pageHeight = 25;
        const labelWidth = 37;

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [pageWidth, pageHeight]
        });

        let currentX = 0;
        let labelsInCurrentRow = 0;

        const selectedProducts = Object.values(this.state.productSelected);

        for (const product of selectedProducts) {
            const to_print = product.type_print === "row" ? product.to_print * 3 : product.to_print;

            for (let i = 0; i < to_print; i++) {

                if (labelsInCurrentRow === 3) {
                    pdf.addPage([pageWidth, pageHeight], 'landscape');
                    currentX = 0;
                    labelsInCurrentRow = 0;
                }

                await this.renderFromJSON(pdf, template, product, currentX, 0);

                currentX += labelWidth;
                labelsInCurrentRow++;
            }
        }

        const blob = pdf.output('blob');
        this.state.pdfData = URL.createObjectURL(blob);

        const isSmallScreen = window.matchMedia("(max-width: 576px)").matches;
        if(isSmallScreen) pdf.save("etiquetas.pdf");

    } catch (error) {
        console.error('Error generando PDF:', error);
        this.notification.add('Error al generar el PDF', { type: 'danger' });
    } finally {
        this.state.generatingPdf = false;
    }
}

export function clearPdf() {
    if (this.state.pdfData) {
        URL.revokeObjectURL(this.state.pdfData);
    }
    this.state.pdfData = null;
}
