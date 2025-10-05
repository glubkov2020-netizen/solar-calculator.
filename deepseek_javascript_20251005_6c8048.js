// Данные о солнечной инсоляции для разных регионов России (кВт*ч/м²/день)
const SOLAR_IRRADIANCE = {
    "Москва": {"зима": 0.8, "весна": 3.2, "лето": 4.5, "осень": 1.5},
    "Санкт-Петербург": {"зима": 0.5, "весна": 2.8, "лето": 4.0, "осень": 1.2},
    "Сочи": {"зима": 1.8, "весна": 3.8, "лето": 5.2, "осень": 2.5},
    "Екатеринбург": {"зима": 0.9, "весна": 3.3, "лето": 4.4, "осень": 1.4},
    "Новосибирск": {"зима": 0.7, "весна": 3.1, "лето": 4.3, "осень": 1.3},
    "Владивосток": {"зима": 1.5, "весна": 3.6, "лето": 4.8, "осень": 2.2},
    "Краснодар": {"зима": 1.6, "весна": 3.7, "лето": 5.0, "осень": 2.3},
    "Ростов-на-Дону": {"зима": 1.2, "весна": 3.5, "лето": 4.9, "осень": 2.0}
};

// КПД солнечных панелей разных типов
const PANEL_EFFICIENCY = {
    "монокристаллические": 0.22,
    "поликристаллические": 0.18,
    "тонкопленочные": 0.12
};

// Стоимость оборудования (руб за Вт)
const EQUIPMENT_COST = {
    "монокристаллические": 45,
    "поликристаллические": 35,
    "тонкопленочные": 25
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    const angleSlider = document.getElementById('panel_angle');
    const angleValue = document.getElementById('angle-value');
    
    // Обновление значения угла наклона
    if (angleSlider && angleValue) {
        angleSlider.addEventListener('input', function() {
            angleValue.textContent = this.value + '°';
        });
    }
});

// Функция расчета солнечной энергии
function calculateSolarEnergy() {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    // Показываем индикатор загрузки
    loading.classList.remove('hidden');
    if (results) results.classList.add('hidden');
    
    // Собираем данные из формы
    const region = document.getElementById('region').value;
    const panel_type = document.getElementById('panel_type').value;
    const panel_power = parseFloat(document.getElementById('panel_power').value) || 0;
    const panel_count = parseInt(document.getElementById('panel_count').value) || 0;
    const panel_angle = parseFloat(document.getElementById('panel_angle').value) || 30;
    const battery_capacity = parseFloat(document.getElementById('battery_capacity').value) || 0;
    const inverter_power = parseFloat(document.getElementById('inverter_power').value) || 0;
    
    // Проверяем обязательные поля
    if (!region || !panel_type || !panel_power || !panel_count) {
        alert('Заполните все обязательные поля');
        loading.classList.add('hidden');
        return;
    }
    
    // Имитируем загрузку для красоты
    setTimeout(() => {
        const result = performCalculations(
            region, panel_type, panel_power, panel_count, 
            panel_angle, battery_capacity, inverter_power
        );
        displayResults(result);
        loading.classList.add('hidden');
    }, 1000);
}

// Основные расчеты
function performCalculations(region, panel_type, panel_power, panel_count, 
                           panel_angle, battery_capacity, inverter_power) {
    
    const total_power = panel_power * panel_count;
    const efficiency = PANEL_EFFICIENCY[panel_type] || 0.18;
    
    // Расчет выработки по сезонам
    const seasonal_generation = {};
    let total_annual_generation = 0;
    
    for (const [season, irradiance] of Object.entries(SOLAR_IRRADIANCE[region])) {
        // Корректировка на угол наклона
        const angle_factor = 1 - Math.abs(panel_angle - 35) * 0.01;
        
        // Расчет дневной выработки
        const daily_generation = total_power * irradiance * efficiency * angle_factor / 1000;
        
        // Расчет сезонной выработки (90 дней в сезоне)
        const days_in_season = 90;
        seasonal_generation[season] = {
            "daily": Math.round(daily_generation * 100) / 100,
            "seasonal": Math.round(daily_generation * days_in_season * 100) / 100
        };
        
        total_annual_generation += seasonal_generation[season]["seasonal"];
    }
    
    // Расчет экономии (стоимость кВт*ч = 5 руб)
    const electricity_price = 5;
    const annual_savings = Math.round(total_annual_generation * electricity_price * 100) / 100;
    
    // Расчет стоимости системы
    const system_cost = Math.round(total_power * (EQUIPMENT_COST[panel_type] || 35));
    
    // Расчет окупаемости (лет)
    const payback_period = annual_savings > 0 ? 
        Math.round(system_cost / annual_savings * 10) / 10 : 0;
    
    // Расчет автономности от батарей (часы)
    const autonomy_hours = battery_capacity > 0 ? 
        Math.round(battery_capacity * 0.8 / (total_power / 1000) * 10) / 10 : 0;
    
    // Использование инвертора
    const inverter_utilization = inverter_power > 0 ? 
        Math.round((total_power / inverter_power) * 100 * 10) / 10 : 0;
    
    return {
        "total_power": total_power,
        "efficiency": Math.round(efficiency * 100 * 10) / 10,
        "seasonal_generation": seasonal_generation,
        "total_annual_generation": Math.round(total_annual_generation * 100) / 100,
        "annual_savings": annual_savings,
        "system_cost": system_cost,
        "payback_period": payback_period,
        "autonomy_hours": autonomy_hours,
        "inverter_utilization": inverter_utilization
    };
}

// Функция отображения результатов
function displayResults(data) {
    const results = document.getElementById('results');
    if (!results) return;
    
    // Форматируем числа
    const formatNumber = (num) => new Intl.NumberFormat('ru-RU').format(num);
    
    // Создаем HTML для результатов
    let html = `
        <div class="results-summary">
            <div class="summary-card">
                <h3>Общая мощность</h3>
                <div class="summary-value">${formatNumber(data.total_power)} Вт</div>
            </div>
            <div class="summary-card">
                <h3>Годовая выработка</h3>
                <div class="summary-value">${formatNumber(data.total_annual_generation)} кВт*ч</div>
            </div>
            <div class="summary-card">
                <h3>Годовая экономия</h3>
                <div class="summary-value">${formatNumber(data.annual_savings)} руб</div>
            </div>
            <div class="summary-card">
                <h3>Срок окупаемости</h3>
                <div class="summary-value">${data.payback_period} лет</div>
            </div>
        </div>
        
        <div class="results-details">
            <div class="detail-section">
                <h3>Выработка по сезонам</h3>
                <div class="season-grid">
    `;
    
    // Добавляем данные по сезонам
    for (const [season, values] of Object.entries(data.seasonal_generation)) {
        html += `
            <div class="season-card">
                <div class="season-name">${season.charAt(0).toUpperCase() + season.slice(1)}</div>
                <div class="season-value">${values.daily} кВт*ч/день</div>
                <div class="season-subvalue">${formatNumber(values.seasonal)} кВт*ч за сезон</div>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Экономические показатели</h3>
                <div class="economic-results">
                    <div class="economic-item">
                        <span class="economic-label">Стоимость системы:</span>
                        <span class="economic-value">${formatNumber(data.system_cost)} руб</span>
                    </div>
                    <div class="economic-item">
                        <span class="economic-label">Годовая экономия:</span>
                        <span class="economic-value">${formatNumber(data.annual_savings)} руб</span>
                    </div>
                    <div class="economic-item">
                        <span class="economic-label">Срок окупаемости:</span>
                        <span class="economic-value">${data.payback_period} лет</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Технические параметры</h3>
                <div class="technical-results">
                    <div class="technical-item">
                        <span class="technical-label">КПД системы:</span>
                        <span class="technical-value">${data.efficiency}%</span>
                    </div>
    `;
    
    if (data.autonomy_hours > 0) {
        html += `
            <div class="technical-item">
                <span class="technical-label">Автономность:</span>
                <span class="technical-value">${data.autonomy_hours} часов</span>
            </div>
        `;
    }
    
    if (data.inverter_utilization > 0) {
        html += `
            <div class="technical-item">
                <span class="technical-label">Использование инвертора:</span>
                <span class="technical-value">${data.inverter_utilization}%</span>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
        </div>
        
        <div class="actions">
            <button class="btn btn-primary" onclick="window.location.reload()">Новый расчет</button>
        </div>
    `;
    
    // Вставляем HTML и показываем результаты
    results.innerHTML = html;
    results.classList.remove('hidden');
    
    // Прокручиваем к результатам
    results.scrollIntoView({ behavior: 'smooth' });
}