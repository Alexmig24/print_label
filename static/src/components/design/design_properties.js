/** @odoo-module **/

export function updateText(value) {
    const obj = this.state.selected;
    if (obj && obj.type === 'i-text') {
        obj.set('text', value);
        this.state.text = value;
        this.canvas.renderAll();
    }
}

export function setFontSize(size) {
    const obj = this.state.selected;
    if (obj) {
        obj.set('fontSize', parseInt(size));
        this.state.fontSize = parseInt(size);
        this.canvas.renderAll();
    }
}

export function toggleBold() {
    const obj = this.state.selected;
    if (obj) {
        const isBold = obj.fontWeight === 'bold';
        obj.set('fontWeight', isBold ? 'normal' : 'bold');
        this.state.bold = !isBold;
        this.canvas.renderAll();
    }
}

export function toggleItalic() {
    const obj = this.state.selected;
    if (obj) {
        const isItalic = obj.fontStyle === 'italic';
        obj.set('fontStyle', isItalic ? 'normal' : 'italic');
        this.state.italic = !isItalic;
        this.canvas.renderAll();
    }
}

export function setTextAlign(align) {
    const obj = this.state.selected;
    if (obj) {
        obj.set('textAlign', align);
        this.state.textAlign = align;
        this.canvas.renderAll();
    }
}

export function setFill(color) {
    const obj = this.state.selected;
    if (obj) {
        obj.set('fill', color);
        this.state.fill = color;
        this.canvas.renderAll();
    }
}

export function setStroke(color) {
    const obj = this.state.selected;
    if (obj) {
        obj.set('stroke', color);
        this.state.stroke = color;
        this.canvas.renderAll();
    }
}

export function setShapeFill(color) {
    const obj = this.state.selected;
    if (obj) {
        obj.set('fill', color);
        this.state.shapeFill = color;
        this.canvas.renderAll();
    }
}

export function setCustomExpression(expression) {
    const obj = this.state.selected;
    if (!obj) return;
    obj.customExpression = expression;
    this.state.customExpression = expression;

    if (obj.type === 'i-text') {
        obj.set('text', expression);
        this.canvas.renderAll();
    } else if (obj.objectType === 'barcode') {
        const tempValue = expression.replace(/\$\{[^}]+\}/g, '0');
        obj.barcodeValue = tempValue;
        this._refreshBarcodePreview(obj, obj.barcodeFormat || 'QR');
    }
}

export function setBarcodeFormat(format) {
    const obj = this.state.selected;
    if (obj && obj.objectType === 'barcode') {
        obj.barcodeFormat = format;
        this.state.barcodeFormat = format;
        this._refreshBarcodePreview(obj, format);
    }
}

export async function _refreshBarcodePreview(obj, format) {
    const value = obj.barcodeValue || '000000';

    if (format === 'QR') {
        try {
            const qr = qrcode(0, "L");
            qr.addData(value);
            qr.make();

            const dataUrl = qr.createDataURL(4);

            const imgEl = new Image();
            imgEl.onload = () => {
                obj.setElement(imgEl);
                obj.setCoords();
                this.canvas.renderAll();
            };
            imgEl.src = dataUrl;
        } catch (e) {
            console.error('Error generating QR preview:', e);
        }
    } else {
        try {
            const tempCanvas = document.createElement('canvas');
            JsBarcode(tempCanvas, value, {
                format: format,
                displayValue: false,
                margin: 0,
            });
            const imgEl = new Image();
            imgEl.onload = () => {
                obj.setElement(imgEl);
                obj.setCoords();
                this.canvas.renderAll();
            };
            imgEl.src = tempCanvas.toDataURL("image/png");
        } catch (e) {
            console.error('Error generating barcode preview:', e);
            this.notification.add(`Formato "${format}" no compatible con el valor actual`, { type: 'warning' });
        }
    }
}
