import * as Api from '/api.js';
import { addCommas } from '/useful-functions.js';

// 요소(element), input 혹은 상수
const image = document.querySelector('#image');
const madeBy = document.querySelector('#madeBy');
const name = document.querySelector('#name');
const description = document.querySelector('#description');
const price = document.querySelector('#price');
const inventoryButton = document.querySelector('#inventory-button');
const purchaseButton = document.querySelector('#purchase-button');
const reviewBody = document.querySelector('#review-body');
const pageNumbers = document.querySelector('#page-numbers');
const reviewWriteButton = document.querySelector('#review-write-button');
const reviewInput = document.querySelector('#review-input');
const reviewCreateContainer = document.querySelector('#review-create-container');
const reviewCreateButton = document.querySelector('#review-create-button');

addAllElements();
addAllEvents();

// html에 요소를 추가하는 함수들을 묶어주어서 코드를 깔끔하게 하는 역할임.
function addAllElements() {
    showProductDetail();
    showReviews();
}

// 여러 개의 addEventListener들을 묶어주어서 코드를 깔끔하게 하는 역할임.
function addAllEvents() {
    inventoryButton.addEventListener('click', addToInventory);
    purchaseButton.addEventListener('click', purchaseCallback);
    reviewWriteButton.addEventListener('click', reviewWriteCallback);
    reviewCreateButton.addEventListener('click', reviewCreateCallback);
}

// 장바구니 클릭시 localStorage에 항목 저장
async function addToInventory() {
    const productId = location.pathname.split('/')[2];

    try {
        const data = await Api.get('/productInfo', productId);
        localStorage.setItem(data.productId, JSON.stringify(data));
        alert('상품이 장바구니에 성공적으로 추가되었습니다.');
    } catch (err) {
        console.error(err.stack);
        alert(
            `문제가 발생하였습니다. 확인 후 다시 시도해 주세요: ${err.message}`
        );
    }
}

// 선택 상품 아이디 배열 저장, 이동
function purchaseCallback() {
    localStorage.setItem(
        'productIds',
        JSON.stringify([location.pathname.split('/')[2]])
    );
    location.href = '/payment';
}

// 리뷰 작성
function reviewWriteCallback() {
    reviewCreateContainer.style.display = 'block';
    reviewWriteButton.style.display = 'none';
}

// 리뷰 작성 완료
async function reviewCreateCallback() {
    const productId = location.pathname.split('/')[2];
    try {
        await Api.post('/review', {
            title: 'test-title',
            content: reviewInput.value,
            author: 'test-author',
            productId: productId,
        });
    
        reviewWriteButton.style.display = 'block';
        reviewCreateContainer.style.display = 'none';
        showReviews();
    } catch (err) {
        console.error(err.stack);
        alert(
            `문제가 발생하였습니다. 확인 후 다시 시도해 주세요: ${err.message}`
        );
    }
}

// 상품 상세
async function showProductDetail() {
    // /product/:productId 형식이라 split으로 productId만 가져오기
    const productId = location.pathname.split('/')[2];

    try {
        // api로 데이터를 받아옴
        const product = await Api.get('/productInfo', productId);
        image.src = product.src;
        madeBy.innerHTML = product.madeBy;
        name.innerHTML = product.name;
        price.innerHTML = addCommas(product.price) + '원';
        description.innerHTML = product.description;
    } catch (err) {
        console.error(err.stack);
        alert(
            `문제가 발생하였습니다. 확인 후 다시 시도해 주세요: ${err.message}`
        );
    }
}

// 리뷰
async function showReviews() {
    const productId = location.pathname.split('/')[2];

    try {
        const { totalPage } = await Api.get('/review', productId);
        pageNumbers.innerHTML = '';

        pageCallback(1);

        for (let i = 1; i < totalPage; i++) {
            const pTag = document.createElement('p');
            pTag.className = 'page-number';
            pTag.innerHTML = i;
            pTag.addEventListener('click', () => {
                pageCallback(i);
            });
            pageNumbers.appendChild(pTag);
        }
    } catch (err) {
        console.error(err.stack);
        alert(
            `문제가 발생하였습니다. 확인 후 다시 시도해 주세요: ${err.message}`
        );
    }
}

async function pageCallback(pageNumber) {
    const productId = location.pathname.split('/')[2];

    try {
        const { reviews } = await Api.get('/review', `${productId}?page=${pageNumber}`);
        reviewBody.innerHTML = '';
        reviews.forEach((review) => {
            const reviewContent = document.createElement('div');
            reviewContent.className = 'review-content';
            reviewContent.innerHTML = review.content;

            const reviewAuthor = document.createElement('div');
            reviewAuthor.className = 'review-author';
            reviewAuthor.innerHTML = review.author;

            const reviewUpdate = document.createElement('button');
            reviewUpdate.className = 'review-update';
            reviewUpdate.setAttribute('id', `review-update-${review.reviewId}`);
            reviewUpdate.innerHTML = 
            `<span class="icon">
                <i class="fas fa-pencil" aria-hidden="true"></i>
            </span>`;
            reviewUpdate.addEventListener('click', () => {
                reviewUpdateContainer.style.display = 'block';
            });

            const reviewDelete = document.createElement('button');
            reviewDelete.className = 'review-delete';
            reviewDelete.setAttribute('id', `review-delete-${review.reviewId}`);
            reviewDelete.innerHTML = 
            `<span class="icon">
                <i class="fas fa-trash-can" aria-hidden="true"></i>
            </span>`;
            reviewDelete.addEventListener('click', async () => {
                await Api.delete('/review', review.reviewId, review);
                reviewBody.removeChild(reviewBodyContainer);
            });

            const reviewElem = document.createElement('div');
            reviewElem.className = 'review';
            reviewElem.setAttribute('id', `review-${review.reviewId}`);
            reviewElem.appendChild(reviewContent);
            reviewElem.appendChild(reviewAuthor);
            reviewElem.appendChild(reviewUpdate);
            reviewElem.appendChild(reviewDelete);

            const reviewInput = document.createElement('textarea');
            reviewInput.className = 'review-input';
            reviewInput.setAttribute('type', 'text');
            reviewInput.innerHTML = review.content;

            const reviewUpdateButton = document.createElement('button');
            reviewUpdateButton.classList.add('button', 'is-danger');
            reviewUpdateButton.setAttribute('id', `review-update-button-${review.reviewId}`);
            reviewUpdateButton.innerHTML = '수정완료';
            reviewUpdateButton.addEventListener('click', async () => {
                reviewContent.innerHTML = reviewInput.value;
                await Api.patch('/review', review.reviewId, {
                    title: '',
                    content: reviewContent.innerHTML,
                    author: 'test-author',
                    productId: productId,
                });
                reviewUpdateContainer.style.display = 'none';
            });

            const reviewButton = document.createElement('div');
            reviewButton.className = 'review-button';
            reviewButton.appendChild(reviewUpdateButton);

            const reviewUpdateContainer = document.createElement('div');
            reviewUpdateContainer.className = 'review-update-container';
            reviewUpdateContainer.setAttribute('id', `review-update-${review.reviewId}`);
            reviewUpdateContainer.setAttribute('style', 'display: none;');
            reviewUpdateContainer.appendChild(reviewInput);
            reviewUpdateContainer.appendChild(reviewButton);

            const reviewBodyContainer = document.createElement('div');
            reviewBodyContainer.className = 'review-body-container';
            reviewBodyContainer.appendChild(reviewElem);
            reviewBodyContainer.appendChild(reviewUpdateContainer);

            reviewBody.appendChild(reviewBodyContainer);
        });
    } catch (err) {
        console.error(err.stack);
        alert(
            `문제가 발생하였습니다. 확인 후 다시 시도해 주세요: ${err.message}`
        );
    }
}
