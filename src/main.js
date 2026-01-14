/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const fullPrice = sale_price * quantity;
    const discountAmount = fullPrice * (discount / 100);
    const revenue = fullPrice - discountAmount;
    return  revenue;
   // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if (total=== 0) {
        return 0;
    };
    if (index===0) {
        return profit * 0.15;
    };
    if (index === 1 || index === 2) {
        return profit * 0.1;
    };
    if (index === total - 1) {
        return 0;
    };
    return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data || typeof data !=='object') {
        throw new Error('Некорректные входные данные');
    }
    if (!data.sellers || !Array.isArray(data.sellers) || data.sellers.length === 0){
        throw new Error('Отсутствуют данные о продавцах');
    }
    if (!data.purchase_records || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Отсутствуют данные о продажах');
    }
    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Отсутствуют данные о товарах');
    }

    // @TODO: Проверка наличия опций

    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Не переданы необходимые функции calculateRevenue и calculateBonus');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        cost: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = {};
        sellerStats.forEach(seller => {
        sellerIndex[seller.seller_id] = seller;
    });
    const productIndex = {};
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; 

        // Увеличить количество продаж
        seller.sales_count += 1;
        // Увеличить общую сумму выручки всех продаж
        seller.revenue += record.total_amount || 0;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            
            const cost = product.purchase_price * item.quantity;
            
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            
            const revenue = calculateRevenue(item, product);

            // Посчитать прибыль: выручка минус себестоимость

            const profit = revenue - cost;
        // Увеличить общую накопленную прибыль (profit) у продавца  

            seller.cost += cost
            seller.revenue += revenue;
            seller.profit += profit

            // Учёт количества проданных товаров

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            // По артикулу товара увеличить его проданное количество у продавца

            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => b.profit - a.profit); 

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) =>{
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                    sku,
                    quantity
                }))
            .sort((a,b) => b.quantity-a.quantity)
            .slice(0,10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
            seller_id: seller.seller_id,
            name:   seller.name,
            revenue: +(seller.revenue.toFixed(2)),
            profit: +(seller.profit.toFixed(2)),
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: +(seller.bonus.toFixed(2))
    }));
}
