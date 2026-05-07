/** @odoo-module **/

export function addText() {
    const text = new fabric.IText('Texto libre', {
        left: 60, top: 60,
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
    });
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
    this.canvas.renderAll();
}

export function deleteObject() {
    const obj = this.canvas.getActiveObject();
    if (obj) {
        this.canvas.remove(obj);
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
    }
}

export function duplicate() {
    const obj = this.canvas.getActiveObject();
    if (!obj) return;

    obj.clone((cloned) => {
        cloned.set({ left: obj.left + 15, top: obj.top + 15 });
        if (obj.fieldKey) cloned.fieldKey = obj.fieldKey;
        if (obj.customExpression) cloned.customExpression = obj.customExpression;
        if (obj.objectType) cloned.objectType = obj.objectType;
        if (obj.barcodeValue) cloned.barcodeValue = obj.barcodeValue;
        if (obj.barcodeFormat) cloned.barcodeFormat = obj.barcodeFormat;
        this.canvas.add(cloned);
        this.canvas.setActiveObject(cloned);
        this.canvas.renderAll();
    });
}

export function setPosX(val) {
    const obj = this.state.selected;
    if (obj) {
        obj.set('left', parseInt(val));
        this.state.posX = parseInt(val);
        this.canvas.renderAll();
    }
}

export function setPosY(val) {
    const obj = this.state.selected;
    if (obj) {
        obj.set('top', parseInt(val));
        this.state.posY = parseInt(val);
        this.canvas.renderAll();
    }
}

export function addCustomText() {
    const text = new fabric.IText('${id}', {
        left: 60, top: 60,
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
    });
    text.customExpression = '${id}';
    text.objectType = 'custom';
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
    this.canvas.renderAll();
}

export function addCustomBarcode() {
    const expression = 'https://enovabest.com/p/${id}';
    const tempValue = expression.replace(/\$\{[^}]+\}/g, '0');

    const qr = qrcode(0, "L");
    qr.addData(tempValue);
    qr.make();
    const dataUrl = qr.createDataURL(4);

    const imgEl = new Image();
    imgEl.onload = () => {
        const fabricImg = new fabric.Image(imgEl, {
            left: 60,
            top: 60,
        });
        fabricImg.objectType = 'barcode';
        fabricImg.barcodeFormat = 'QR';
        fabricImg.barcodeValue = tempValue;
        fabricImg.customExpression = expression;

        this.canvas.add(fabricImg);
        this.canvas.setActiveObject(fabricImg);
        this.canvas.renderAll();
    };
    imgEl.src = dataUrl;
}
