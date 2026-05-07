/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Product } from "@print_label/components/product/product"

import * as pagination from "./list_products_pagination";
import * as pdf from "./list_products_pdf";
import * as render from "./list_products_render";
import * as templates from "./list_products_templates";

class ListProducts extends Component {

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.state = useState({
            products: [],
            currentPage: 1,
            pageSize: 18,
            totalProducts: 0,
            totalPages: 0,
            loading: false,
            searchTerm: "",
            searchTimeout: null,
            productSelected: {},
            pdfData: null,
            generatingPdf: false,
            templateId: null,
        });

        onWillStart(async () => {
            await Promise.all([
                this.loadProducts(),
                this.loadTemplate(),
            ]);
        });
    }

    get selectedLength() {
        return Object.values(this.state.productSelected).length;
    }
}

Object.assign(ListProducts.prototype, pagination);
Object.assign(ListProducts.prototype, pdf);
Object.assign(ListProducts.prototype, render);
Object.assign(ListProducts.prototype, templates);

ListProducts.template = "print_label.ListProducts";
ListProducts.components = { Product };

registry.category("actions").add("print_label.list_products", ListProducts);
