"use strict";

const apiURL = "https://api.valantis.store:41000/";

const offset = 0;
const limit = 1500;


const itemsPerPage = 50; //Количество продуктов на страницу
let currentPage = 1;

let filteredKeysProducts = [];
let fieldsProducts = []; // //Массив полей, которые мы получаем при вызове метода get_fields


let productsFilteredByPrice = [];

let currentItem = 0;
let previousItem = 0;

let firstField = 0;
let secondField = 0;

let messageField = document.querySelector(".catalog__message");

async function fetchProducts(action, params) {
    const authHeader = generateAuthHeader();
    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader,
            },
            body: JSON.stringify({ "action": action, "params": params }),
        })
        if (response.status === 500) {
            fetchProducts(action, params);
        };

        const result = await response.json();

        if (action === 'get_ids') {
            let keysProducts = []
            keysProducts = result.result;
            getProducts(keysProducts);
        } else if (action === 'get_items') {
            let itemsArray = [];
            itemsArray = result.result;
            renderCatalog(cleaningOfDuplicates(itemsArray));
        } else if (action === 'get_fields') {
            let fieldsProductsFormated = [];
            fieldsProductsFormated = [...new Set(result.result)];
            fieldsProductsFormated.sort();
            console.log('Бренды продуктов', fieldsProductsFormated)
            renderBrands(fieldsProductsFormated);
        } else if (action === 'filter') {
            filteredKeysProducts = result.result;
            console.log('filteredKeysProducts', filteredKeysProducts)
            getProducts(filteredKeysProducts);
        }
    } catch (error) {
        console.error('Error fetching products', error.message);
    }
};

function generateAuthHeader() {
    const apiSecret = 'Valantis';
    const timestamp = new Date().toISOString().slice(0, 10).split('-').join('');
    const authHeader = CryptoJS.MD5(`${apiSecret}_${timestamp}`).toString();
    return { 'X-Auth': authHeader };
}

const paginationContainer = document.getElementById('pagination');

function cleaningOfDuplicates(array) {
    let formatProducts = [];
    array.forEach(item => {
        currentItem = item;
        if (previousItem.id != currentItem.id || previousItem == 0) {
            formatProducts.push(currentItem);
        };
        previousItem = currentItem;
    });
    console.log('Продукты без дубликатов', formatProducts)
    return formatProducts;
}

function renderCatalog(currentArrayOfProducts) {

    function renderProducts(currentArrayOfProducts) {
        const productsContainer = document.getElementById('products');
        productsContainer.innerHTML = '';
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const currentProducts = currentArrayOfProducts.slice(startIdx, endIdx);
        currentProducts.forEach(item => {
            const productElement = document.createElement('li');
            productElement.classList.add('catalog__product');
            productElement.innerHTML = `
            <div class="product__img"></div>
              <p>ID: ${item.id}</p>
              <p>Name: ${item.product}</p>
              <p>Price: ${item.price}</p>
              <p>Brand: ${item.brand || 'N/A'}</p>
            `;
            productsContainer.appendChild(productElement);
        });
    };

    function renderPagination(currentArrayOfProducts) {
        if (messageField.textContent == '') {
            paginationContainer.innerHTML = '';
            const totalPages = Math.ceil(currentArrayOfProducts.length / itemsPerPage);
            if (totalPages <= 7) {
                renderAllPages(totalPages, currentArrayOfProducts);
            } else {
                renderLimitedPages(totalPages, currentArrayOfProducts);
            }
        }
    };

    function renderAllPages(totalPages, currentArrayOfProducts) {
        const prevButton = createPaginationButton('Prev', () => changePage(currentPage - 1, currentArrayOfProducts));
        paginationContainer.appendChild(prevButton);
        for (let page = 1; page <= totalPages; page++) {
            const pageButton = createPaginationButton(page, () => changePage(page, currentArrayOfProducts));
            paginationContainer.appendChild(pageButton);
        }
        const nextButton = createPaginationButton('Next', () => changePage(currentPage + 1, currentArrayOfProducts));
        paginationContainer.appendChild(nextButton);
    };

    function createPaginationButton(label, onClick) {
        const button = document.createElement('button');
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    };

    function renderLimitedPages(totalPages, currentArrayOfProducts) {
        const prevButton = createPaginationButton('Prev', () => changePage(currentPage - 1, currentArrayOfProducts));
        paginationContainer.appendChild(prevButton);
        for (let page = 1; page <= 5; page++) {
            const pageButton = createPaginationButton(page, () => changePage(page, currentArrayOfProducts));
            paginationContainer.appendChild(pageButton);
        }
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        paginationContainer.appendChild(ellipsis);
        const lastPageButton = createPaginationButton(totalPages, () => changePage(totalPages, currentArrayOfProducts));
        paginationContainer.appendChild(lastPageButton);
        const nextButton = createPaginationButton('Next', () => changePage(currentPage + 1, currentArrayOfProducts));
        paginationContainer.appendChild(nextButton);
    };

    renderProducts(currentArrayOfProducts);
    renderPagination(currentArrayOfProducts);

    function changePage(newPage, currentArrayOfProducts) {
        if (newPage >= 1 && newPage <= Math.ceil(currentArrayOfProducts.length / itemsPerPage)) {
            currentPage = newPage;
            renderProducts(currentArrayOfProducts);
        }
    };
}

function renderBrands(currentBrandsArray) {
    const brandsContainer = document.querySelector('.catalog__brands ul');
    brandsContainer.innerHTML = '';
    currentBrandsArray.forEach(brand => {
        const productElement = document.createElement('li');
        productElement.classList.add('catalog__brand-item');
        productElement.innerHTML = `
        <input type="checkbox" data-name="${brand}">
        <p>${brand}</p>
        `;
        brandsContainer.appendChild(productElement);
    });
};

function filterBrands() {
    let brandsForFilter = document.querySelectorAll('input[type="checkbox"]');
    let brandsForFilterWithoutAllCheckbox = [];
    brandsForFilter.forEach(checkbox => {
        if (checkbox.id != 'selectAll' && checkbox.checked) {
            brandsForFilterWithoutAllCheckbox.push(checkbox.dataset.name)
        }
    });
    for (let key in brandsForFilterWithoutAllCheckbox) {
        if (brandsForFilterWithoutAllCheckbox[key] === 'null') {
            brandsForFilterWithoutAllCheckbox[key] = null;
        }
    };

    if (!catalogBrandsList.classList.contains("visually-hidden")) {
        catalogBrandsList.classList.toggle("visually-hidden")
    }
    console.log(brandsForFilterWithoutAllCheckbox);
    fetchProducts('filter', {brand: brandsForFilterWithoutAllCheckbox[0] });
};

function filterPrice() {
    const priceField = document.getElementById('priceField');
    let priceValue = priceField.value;
    fetchProducts('filter', { price: Number(priceValue) });

    if (priceValue == 0 || priceValue == null) {
        messageField.textContent = "Неверно выбрана цена"
        messageField.classList.remove("visually-hidden");
        paginationContainer.innerHTML = '';
    } else {
        messageField.classList.add("visually-hidden");
    }
}

function filterName() {

    const productNameField = document.getElementById("productNameField");
    let query = productNameField.value;
    
    fetchProducts('filter', { product: query});
    if (query == '') {
        messageField.textContent = `Отсутствуют товары без названия`
        messageField.classList.remove("visually-hidden");
    };
};

function clearAllFilters() {
    const productNameField = document.getElementById("productNameField");
    productNameField.value = '';

    const priceField = document.getElementById('priceField');
    priceField.value = '';

    let brandsForFilter = document.querySelectorAll('input[type="checkbox"]');
    brandsForFilter.forEach(checkbox => {
        checkbox.checked = false;
    });
    if (!catalogBrandsList.classList.contains("visually-hidden")) {
        catalogBrandsList.classList.toggle("visually-hidden")
    }
    if (!messageField.classList.contains("visually-hidden")) {
        messageField.classList.toggle("visually-hidden");
        messageField.textContent = '';
    }

    initialLoad();
}

function getProducts(keysArray) {
    fetchProducts('get_items', { ids: keysArray });
};

async function initialLoad() {
    fetchProducts('get_ids', { offset: offset, limit: limit });
    fetchProducts('get_fields', { "field": "brand", "offset": offset, "limit": 8012 });
};


initialLoad();

let brandsBtn = document.getElementById("brands");
let catalogBrandsList = document.querySelector(".catalog__brands");
brandsBtn.addEventListener('click', () => {
    catalogBrandsList.classList.toggle("visually-hidden");
});

function toggle(source) {
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox != source)
            checkbox.checked = source.checked;
    });
    checkboxes.forEach(checkbox => {
        console.log(checkbox.value)
    });
    console.log(checkboxes)
}






