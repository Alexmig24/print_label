/** @odoo-module **/

export async function loadProducts() {
    this.state.loading = true;
    try {
        const result = await this.orm.call(
            "ome.print.label",
            "load_productlist",
            [],
            {
                search_term: this.state.searchTerm || '',
                page: this.state.currentPage,
                page_size: this.state.pageSize
            }
        );

        this.state.products = result.products;
        this.state.totalPages = result.total_pages;

    } catch (error) {
        console.error("Error loading products:", error);
    } finally {
        this.state.loading = false;
    }
}

export async function goToPage(page) {
    if (page < 1 || page > this.state.totalPages) return;
    this.state.currentPage = page;
    await this.loadProducts();
}

export async function nextPage() {
    if (this.state.currentPage < this.state.totalPages) {
        await this.goToPage(this.state.currentPage + 1);
    }
}

export async function prevPage() {
    if (this.state.currentPage > 1) {
        await this.goToPage(this.state.currentPage - 1);
    }
}

export function onSearchInput(ev) {
    const value = ev.target.value;
    this.state.searchTerm = value;

    if (this.state.searchTimeout) {
        clearTimeout(this.state.searchTimeout);
    }

    this.state.searchTimeout = setTimeout(async () => {
        this.state.currentPage = 1;
        await this.loadProducts();
    }, 500);
}

export async function clearSearch() {
    this.state.searchTerm = "";
    this.state.currentPage = 1;
    await this.loadProducts();
}

export function unSelectAll() {
    this.state.productSelected = {}
}

export function onClickProduct(product) {
    if (!this.state.productSelected[product.id]) {
        this.state.productSelected[product.id] = product;
        this.state.productSelected[product.id].to_print = 1;
        this.state.productSelected[product.id].type_print = "row";
    } else {
        delete this.state.productSelected[product.id];
    }
}

export function onProductPrintChange(id, to_print, type_print) {
    if (this.state.productSelected[id]) {
        this.state.productSelected[id].to_print = to_print;
        this.state.productSelected[id].type_print = type_print;
    }
}
