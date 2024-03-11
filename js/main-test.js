"use strict";

const apiURL = "https://api.valantis.store:41000/";

const offset = 0;
const limit = 200;


const itemsPerPage = 50; //Количество продуктов на страницу
// let currentPage = 1; //Текущая страница

let keysProducts = []; //Массив ключей, которые мы получаем при вызове метода get_ids
let formatProducts = []; //Массив уникальных продуктов
let filteredProducts = [];
let fieldsProducts = []; // //Массив полей, которые мы получаем при вызове метода get_fields
let fieldsProductsFormated = [];
let itemsArray = []; //Массив для хранения item-ов

let productsFilteredByPrice = [];

let firstItem = 0;
let secondItem = 0;

let firstField = 0;
let secondField = 0;

async function fetchProducts(action, params) {
    const authHeader = generateAuthHeader();
    try {
        let response = await fetch(apiURL, { // Подключение к API посредством fetch
            method: 'POST',                                                             // Опции метода fetch
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
            keysProducts = result.result;
            console.log('Ключи продуктов', keysProducts);
            getProducts();
        } else if (action === 'get_items') {
            itemsArray = result.result;
            itemsArray.forEach(item => {
                firstItem = item;
                if (secondItem.id != firstItem.id || secondItem == 0) {
                    formatProducts.push(firstItem);
                };
                secondItem = firstItem;
            });
            console.log('Продукты без дубликатов', formatProducts)
            renderProducts(formatProducts);
        } else if (action === 'get_fields') {
            fieldsProducts = result.result;
            fieldsProductsFormated = [...new Set(fieldsProducts)];
            fieldsProductsFormated.sort();
            console.log('Бренды продуктов', fieldsProductsFormated)
            renderBrands(fieldsProductsFormated);
        } else if (action === 'filter') {
            filteredProducts = result.result;
            console.log('filteredProducts', filteredProducts)
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
    renderPagination(currentArrayOfProducts);
}

// function renderPagination(currentArrayOfProducts) {
//     const paginationContainer = document.getElementById('pagination');
//     paginationContainer.innerHTML = '';

//     const totalPages = Math.ceil(currentArrayOfProducts.length / itemsPerPage);

//     const prevButton = createPaginationButton('Prev', () => changePage(currentPage - 1, currentArrayOfProducts));
//     paginationContainer.appendChild(prevButton);

//     for (let page = 1; page <= totalPages; page++) {
//         const pageButton = createPaginationButton(page, () => changePage(page, currentArrayOfProducts));
//         paginationContainer.appendChild(pageButton);
//     }

//     const nextButton = createPaginationButton('Next', () => changePage(currentPage + 1, currentArrayOfProducts));
//     paginationContainer.appendChild(nextButton);
// }

// function createPaginationButton(label, onClick) {
//     const button = document.createElement('button');
//     button.textContent = label;
//     button.addEventListener('click', onClick);
//     return button;
// }

// function changePage(newPage, currentArrayOfProducts) {
//     if (newPage >= 1 && newPage <= Math.ceil(currentArrayOfProducts.length / itemsPerPage)) {
//         currentPage = newPage;
//         renderProducts(currentArrayOfProducts);
//     }
// }

// ------------------------------------------------------------------------------------------------------------------
let currentPage = 1; // Изначально устанавливаем currentPage на 1
const paginationContainer = document.getElementById('pagination');

function renderPagination(currentArrayOfProducts) {
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(currentArrayOfProducts.length / itemsPerPage);

    if (totalPages <= 7) {
        renderAllPages(totalPages, currentArrayOfProducts);
    } else {
        renderLimitedPages(totalPages, currentArrayOfProducts);
    }
}

// Остальной код остается неизменным

// Оставшаяся часть кода
function renderAllPages(totalPages, currentArrayOfProducts) {
    const prevButton = createPaginationButton('Prev', () => changePage(currentPage - 1, currentArrayOfProducts));
    paginationContainer.appendChild(prevButton);

    for (let page = 1; page <= totalPages; page++) {
        const pageButton = createPaginationButton(page, () => changePage(page, currentArrayOfProducts));
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = createPaginationButton('Next', () => changePage(currentPage + 1, currentArrayOfProducts));
    paginationContainer.appendChild(nextButton);
}

function createPaginationButton(label, onClick) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

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
}

function changePage(newPage, currentArrayOfProducts) {
    if (newPage >= 1 && newPage <= Math.ceil(currentArrayOfProducts.length / itemsPerPage)) {
        currentPage = newPage;
        renderProducts(currentArrayOfProducts);
    }
}
// ------------------------------------------------------------------------------------------------------------------
// let currentPage = 1; // Изначально устанавливаем currentPage на 1
// const paginationContainer = document.getElementById('pagination');

// function renderPagination(currentArrayOfProducts) {
//     paginationContainer.innerHTML = '';

//     const totalPages = Math.ceil(currentArrayOfProducts.length / itemsPerPage);

//     if (totalPages <= 7) {
//         renderAllPages(totalPages, currentArrayOfProducts);
//     } else {
//         renderLimitedPages(totalPages, currentArrayOfProducts);
//     }
// }

// function renderAllPages(totalPages, currentArrayOfProducts) {
//     const prevButton = createPaginationButton('Prev', () => changePage(currentPage - 1, currentArrayOfProducts));
//     paginationContainer.appendChild(prevButton);

//     for (let page = 1; page <= Math.min(5, totalPages); page++) {
//         const pageButton = createPaginationButton(page, () => changePage(page, currentArrayOfProducts));
//         paginationContainer.appendChild(pageButton);
//     }

//     if (totalPages > 5) {
//         const ellipsis1 = document.createElement('span');
//         ellipsis1.textContent = '...';
//         paginationContainer.appendChild(ellipsis1);
//     }

//     const nextButton = createPaginationButton('Next', () => changePage(currentPage + 1, currentArrayOfProducts));
//     paginationContainer.appendChild(nextButton);
// }

// function createPaginationButton(label, onClick) {
//     const button = document.createElement('button');
//     button.textContent = label;
//     button.addEventListener('click', onClick);
//     return button;
// }

// function renderLimitedPages(totalPages, currentArrayOfProducts) {
//     const prevButton = createPaginationButton('Prev', () => changePage(currentPage - 1, currentArrayOfProducts));
//     paginationContainer.appendChild(prevButton);

//     for (let page = Math.max(1, currentPage - 2); page <= Math.min(currentPage + 2, totalPages - 1); page++) {
//         const pageButton = createPaginationButton(page, () => changePage(page, currentArrayOfProducts));
//         paginationContainer.appendChild(pageButton);
//     }

//     if (currentPage < totalPages - 3) {
//         const ellipsis1 = document.createElement('span');
//         ellipsis1.textContent = '...';
//         paginationContainer.appendChild(ellipsis1);
//     }

//     const lastPageButton = createPaginationButton(totalPages, () => changePage(totalPages, currentArrayOfProducts));
//     paginationContainer.appendChild(lastPageButton);

//     const nextButton = createPaginationButton('Next', () => changePage(currentPage + 1, currentArrayOfProducts));
//     paginationContainer.appendChild(nextButton);
// }

// function changePage(newPage, currentArrayOfProducts) {
//     if (newPage >= 1 && newPage <= Math.ceil(currentArrayOfProducts.length / itemsPerPage)) {
//         currentPage = newPage;
//         renderProducts(currentArrayOfProducts);
//     }
// }

// const paginationContainer = document.getElementById('pagination');
// let currentPage = 1; // Изначально устанавливаем currentPage на 1

// function renderPagination(currentArrayOfProducts) {
//     paginationContainer.innerHTML = '';

//     const totalPages = Math.ceil(currentArrayOfProducts.length / itemsPerPage);

//     if (totalPages <= 7) {
//         renderAllPages(totalPages, currentArrayOfProducts);
//     } else {
//         renderLimitedPages(totalPages, currentArrayOfProducts);
//     }
// }

// function renderAllPages(totalPages, currentArrayOfProducts) {
//     const prevButton = createPaginationButton('Prev', () => changePage(currentPage - 1, currentArrayOfProducts));
//     paginationContainer.appendChild(prevButton);

//     for (let page = 1; page <= Math.min(5, totalPages); page++) {
//         const pageButton = createPaginationButton(page, () => changePage(page, currentArrayOfProducts));
//         paginationContainer.appendChild(pageButton);
//     }

//     if (totalPages > 5) {
//         const ellipsis1 = document.createElement('span');
//         ellipsis1.textContent = '...';
//         paginationContainer.appendChild(ellipsis1);
//     }

//     const nextButton = createPaginationButton('Next', () => changePage(currentPage + 1, currentArrayOfProducts));
//     paginationContainer.appendChild(nextButton);

//     const lastPageButton = createPaginationButton(totalPages, () => changePage(totalPages, currentArrayOfProducts));
//     paginationContainer.appendChild(lastPageButton);
// }

// function createPaginationButton(label, onClick) {
//     const button = document.createElement('button');
//     button.textContent = label;
//     button.addEventListener('click', onClick);
//     return button;
// }

// function renderLimitedPages(totalPages, currentArrayOfProducts) {
//     const prevButton = createPaginationButton('Prev', () => changePage(currentPage - 1, currentArrayOfProducts));
//     paginationContainer.appendChild(prevButton);

//     // Динамически рассчитываем диапазон отображаемых страниц
//     let startPage, endPage;
//     if (currentPage <= 5) {
//         startPage = 1;
//         endPage = 5;
//     } else {
//         startPage = currentPage - 1;
//         endPage = Math.min(currentPage + 3, totalPages);
//     }

//     // Если мы вышли за пределы, корректируем диапазон
//     if (endPage - startPage < 4) {
//         startPage = Math.max(1, endPage - 4);
//     }

//     // Добавляем кнопку для перехода на первую страницу
//     const firstPageButton = createPaginationButton('1', () => changePage(1, currentArrayOfProducts));
//     paginationContainer.appendChild(firstPageButton);

//     if (startPage > 1) {
//         const ellipsis1 = document.createElement('span');
//         ellipsis1.textContent = '...';
//         paginationContainer.appendChild(ellipsis1);
//     }

//     for (let page = startPage; page <= endPage; page++) {
//         const pageButton = createPaginationButton(page, () => changePage(page, currentArrayOfProducts));
//         paginationContainer.appendChild(pageButton);
//     }

//     if (endPage < totalPages) {
//         const ellipsis2 = document.createElement('span');
//         ellipsis2.textContent = '...';
//         paginationContainer.appendChild(ellipsis2);
//     }

//     const lastPageButton = createPaginationButton(totalPages, () => changePage(totalPages, currentArrayOfProducts));
//     paginationContainer.appendChild(lastPageButton);

//     const nextButton = createPaginationButton('Next', () => changePage(currentPage + 1, currentArrayOfProducts));
//     paginationContainer.appendChild(nextButton);
// }

// function changePage(newPage, currentArrayOfProducts) {
//     if (newPage >= 1 && newPage <= Math.ceil(currentArrayOfProducts.length / itemsPerPage)) {
//         currentPage = newPage;
//         renderProducts(currentArrayOfProducts);
//     }
// }

// // Изначально рендерим пагинацию с первой страницей
// renderPagination(itemsArray);










function renderBrands(currentBrandsArray) {
    const brandsContainer = document.querySelector('.catalog__brands ul');
    currentBrandsArray.forEach(brand => {
        const productElement = document.createElement('li');
        productElement.classList.add('catalog__brand-item');
        productElement.innerHTML = `
        <input type="checkbox">
        <p>${brand}</p>
        `;
        brandsContainer.appendChild(productElement);
    });
}

function getProducts() {
    fetchProducts('get_items', { ids: keysProducts });
};

// Функция для фильтрации продуктов по цене
function filterPrice() {
    const productsFilteredByPrice = [];
    // Получаем значение из поля ввода цены
    const priceField = document.getElementById('priceField');
    const priceValue = priceField.value;

    formatProducts.forEach(product => {
        if (product.price == priceValue) {
            productsFilteredByPrice.push(product)
        }
    })
    renderProducts(productsFilteredByPrice);

    console.log('productsFilteredByPrice', productsFilteredByPrice)
}

function filterName() {
    function filterProductsByName(query) {
        const filteredProducts = formatProducts.filter(item => {
            const lowerCaseQuery = query.toLowerCase();
            return item.product.toLowerCase().includes(lowerCaseQuery)
        });
        return filteredProducts;
    }
    
    const productNameField = document.getElementById("productNameField");
    let query =  productNameField.value;
    const filteredProducts = filterProductsByName(query);
    renderProducts(filteredProducts);
};

// Функция для начальной загрузки продуктов
function initialLoad() {
    fetchProducts('get_ids', { offset: offset });
    fetchProducts('get_fields', { "field": "brand", "offset": 0 });
};

// Вызываем функцию при запуске скрипта
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




// fetchProducts('filter', { price: 17500 });



// console.log('Result of get_ids:', getIdsResult);

// fetchProducts('get_items', { ids: '' });
// console.log('Result of get_items:', getItemsResult);

// fetchProducts('filter', { price: 17500 });
// console.log('Result of get_fields:', getFieldsResult);

// const filterResult = fetchProducts('filter', { price: 17500.0 });
// // console.log('Result of filter:', filterResult);


// ------------------------------------------------------------------------------------------------

