/** @odoo-module **/

export async function generateBarcode(text, width, height, format = 'CODE128') {
    const barcodeText = text || 'EASTEREGG';

    if (format === 'QR') {
        try {
            const qr = qrcode(0, "L");
            qr.addData(barcodeText);
            qr.make();

            const dataUrl = qr.createDataURL(4);
            return dataUrl;
        } catch (error) {
            console.error('Error generando QR:', error);
            throw error;
        }
    }

    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');

            JsBarcode(canvas, barcodeText, {
                format: format,
                width: 2,
                height: height,
                displayValue: false,
                margin: 0
            });

            resolve(canvas.toDataURL('image/png'));
        } catch (error) {
            console.error('Error generando código de barras:', error);
            reject(error);
        }
    });
}

export function replaceVariables(fieldKey, product) {
    if (!fieldKey || !(fieldKey in product)) return fieldKey || '';
    const value = product[fieldKey];
    if (typeof value === 'number') return Number.isInteger(value) ? `${value}` : value.toFixed(2);
    return value || '';
}

export function resolveExpression(expression, product) {
    if (!expression) return '';
    return expression.replace(/\$\{(\w+)\}/g, (match, key) => {
        if (key in product) {
            const value = product[key];
            if (typeof value === 'number') return Number.isInteger(value) ? `${value}` : value.toFixed(2);
            return value ?? '';
        }
        return match;
    });
}

export async function renderFromJSON(pdf, json, product, offsetX = 0, offsetY = 0) {
    for (const obj of json.objects) {

        if (obj.type === 'IText') {

            let text = obj.customExpression
                ? this.resolveExpression(obj.customExpression, product)
                : this.replaceVariables(obj.fieldKey ?? obj.text, product);

            const fontSize = (obj.fontSize || 12) / 3;
            pdf.setFontSize(fontSize);

            const fontStyle = obj.fontWeight === 'bold' ? 'bold' : 'normal';
            pdf.setFont('helvetica', fontStyle);

            const maxWidth = 33;

            text = this.truncateTextToWidth(pdf, text, maxWidth);

            const x = offsetX + (obj.left / 10);
            const y = offsetY + (obj.top / 10);

            let align = 'left';
            if (obj.textAlign === 'center') align = 'center';
            if (obj.textAlign === 'right') align = 'right';

            pdf.text(text, x, y, { align: 'center' });
        }

        if (obj.objectType === 'barcode') {
            const format = obj.barcodeFormat || 'CODE128';
            const barcodeValue = obj.customExpression
                ? this.resolveExpression(obj.customExpression, product)
                : (obj.fieldKey ? this.replaceVariables(obj.fieldKey, product) : product.barcode || product.default_code || '');
            const barcodeData = await this.generateBarcode(
                barcodeValue,
                100,
                40,
                format
            );

            const x = offsetX + (obj.left/10) - (obj.width*obj.scaleX/10)/2;
            const y = offsetY + (obj.top/10) - (obj.height*obj.scaleY/10)/2;

            pdf.addImage(barcodeData, 'PNG', x, y, obj.width*obj.scaleX/10, obj.height*obj.scaleY/10);
        }
    }
}

export function truncateTextToWidth(pdf, text, maxWidth) {
    let truncated = text;

    while (truncated.length > 0) {
        const width = pdf.getTextWidth(truncated);
        if (width <= maxWidth) break;

        truncated = truncated.slice(0, -1);
    }

    if (truncated !== text) {
        truncated = truncated.slice(0, -3) + '...';
    }

    return truncated;
}
