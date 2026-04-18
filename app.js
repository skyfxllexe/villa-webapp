const tg     = window.Telegram.WebApp
const API_URL = "http://localhost:8000"  // потом заменим на VPS/

tg.ready()
tg.expand()

let VILLAS        = []
let currentVilla  = null
const BOT_TOKEN = "8611462123:AAE3LtWIeCOtxdzcDbXYYLXA2BvmxZ1KzUQ"
// ─── Загрузка вилл с API ──────────────────────────
async function loadVillas() {
    try {
        const res  = await fetch(`${API_URL}/villas`)
        VILLAS     = await res.json()
        renderCatalog(VILLAS)
    } catch (e) {
        document.getElementById("catalog").innerHTML = `
            <div class="loading">😔 Не удалось загрузить виллы</div>
        `
    }
}

// ─── Рендер каталога ──────────────────────────────
function renderCatalog(villas) {
    const catalog = document.getElementById("catalog")

    if (villas.length === 0) {
        catalog.innerHTML = `<div class="loading">😔 Виллы не найдены</div>`
        return
    }

    catalog.innerHTML = villas.map(villa => `
        <div class="villa-card" onclick="openModal(${villa.id})">
            ${villa.photos && villa.photos.length > 0
                ? `<img class="villa-photo"
                        src="https://api.telegram.org/file/bot${BOT_TOKEN}/${villa.photos[0]}"
                        onerror="this.parentElement.querySelector('.villa-placeholder') && this.remove()">`
                : `<div class="villa-placeholder">🌴</div>`
            }
            <div class="villa-info">
                <h3>${villa.name}</h3>
                <div class="villa-meta">
                    <span>📍 ${villa.location}</span>
                    <span>👥 до ${villa.guests}</span>
                    <span>🛏 ${villa.bedrooms} сп.</span>
                </div>
                <div class="villa-price">
                    ${villa.price_idr.toLocaleString()} IDR
                    <span style="font-size:13px; color:#888"> (~$${villa.price_usd})</span>
                </div>
                <div class="villa-tags">
                    ${(villa.features || []).slice(0,3).map(f =>
                        `<span class="tag">${f}</span>`
                    ).join("")}
                </div>
                <button class="card-btn">📅 Подробнее</button>
            </div>
        </div>
    `).join("")
}

// ─── Открыть модалку ──────────────────────────────
function openModal(villaId) {
    currentVilla = VILLAS.find(v => v.id === villaId)
    if (!currentVilla) return

    // Фото
    const photosEl = document.getElementById("modal-photos")
    if (currentVilla.photos && currentVilla.photos.length > 0) {
        photosEl.innerHTML = currentVilla.photos.map(p =>
            `<img src="https://api.telegram.org/file/bot${BOT_TOKEN}/${p}">`
        ).join("")
    } else {
        photosEl.innerHTML = `<div class="modal-photo-placeholder">🌴</div>`
    }

    document.getElementById("modal-name").textContent   = currentVilla.name
    document.getElementById("modal-desc").textContent   = currentVilla.description
    document.getElementById("modal-meta").innerHTML     = `
        <span>📍 ${currentVilla.location}</span>
        <span>👥 до ${currentVilla.guests} гостей</span>
        <span>🛏 ${currentVilla.bedrooms} спальни</span>
        <span>💰 ${currentVilla.price_idr.toLocaleString()} IDR/ночь</span>
    `
    document.getElementById("modal-features").innerHTML =
        (currentVilla.features || []).map(f =>
            `<span class="tag">${f}</span>`
        ).join("")

    document.getElementById("modal-rules").innerHTML =
        currentVilla.rules
            ? `📋 ${currentVilla.rules}`
            : ""

    document.getElementById("modal").classList.remove("hidden")
}

// ─── Закрыть модалку ──────────────────────────────
document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("modal").classList.add("hidden")
})

// ─── Кнопка забронировать ─────────────────────────
document.getElementById("modal-book").addEventListener("click", () => {
    if (!currentVilla) return
    // Отправляем данные боту
    tg.sendData(JSON.stringify({
        action:   "book",
        villa_id: currentVilla.id,
        villa_name: currentVilla.name
    }))
})

// ─── Фильтры ──────────────────────────────────────
function applyFilters() {
    const location = document.getElementById("filter-location").value
    const guests   = document.getElementById("filter-guests").value
    const price    = document.getElementById("filter-price").value

    const filtered = VILLAS.filter(v => {
        if (location && v.location !== location) return false
        if (guests   && v.guests < parseInt(guests)) return false
        if (price    && v.price_idr > parseInt(price)) return false
        return true
    })

    renderCatalog(filtered)
}

document.getElementById("filter-location").addEventListener("change", applyFilters)
document.getElementById("filter-guests").addEventListener("change", applyFilters)
document.getElementById("filter-price").addEventListener("change", applyFilters)

// ─── Старт ────────────────────────────────────────
loadVillas()