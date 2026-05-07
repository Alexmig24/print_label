/** @odoo-module **/

import { Component, useState, useRef } from "@odoo/owl";

export class Product extends Component {
    static props = {
        product: { type: Object, optional: false },
        productSelected: { type: Object, optional: true },
        onPrintChange: { type: Function, optional: true },
    };

    setup(){
        this.types = {
            "row": "Fila",
            "qty": "Cantidad",
        }
        this.state = useState({
            type_print: "row",
        })
        this.toPrintRef = useRef("toPrint")
    }

    get typePrint() {
        return this.types[this.props.productSelected.type_print];
    }

    toggleTypePrint(){
        const type = this.state.type_print;
        const to_print = this.toPrintRef.el.value;

        if(type=="row"){
            this.state.type_print="qty";
        }else{
            this.state.type_print="row";
        }

        if (this.props.onPrintChange) {
            this.props.onPrintChange(this.props.product.id, to_print, this.state.type_print);
        }
    }

    getImageUrl(product) {
        if (product.image_128) {
            return `data:image/png;base64,${product.image_128}`;
        }
        return "/web/static/img/placeholder.png";
    }

    formatPrice(price) {
        return price ? `${price.toFixed(2)}` : "$0.00";
    }

    onRowsChange(event) {
        const value = parseInt(event.target.value) || 1;
        const to_print = Math.max(1, value);
        
        if (this.props.onPrintChange) {
            this.props.onPrintChange(this.props.product.id, to_print, this.state.type_print);
        }
    }
}

Product.template = "print_label.Product";