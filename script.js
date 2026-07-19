

// ============================================
// TOAST BİLDİRİM SİSTEMİ (sağ alt köşe infobox)
// ============================================
const TOAST_ICONS = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
const TOAST_TITLES = { success: 'Başarılı', warning: 'Uyarı', error: 'Hata', info: 'Bilgi' };
const TOAST_MAX_VISIBLE = 4;

function showToast(message, type = 'info', duration) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        window.alert(message);
        return;
    }

    // Aynı anda çok fazla toast birikmesin
    while (container.children.length >= TOAST_MAX_VISIBLE) {
        container.removeChild(container.firstElementChild);
    }

    const computedDuration = duration || Math.min(10000, Math.max(4500, message.length * 65));

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</div>
        <div class="toast-content">
            <div class="toast-title">${TOAST_TITLES[type] || TOAST_TITLES.info}</div>
            <div class="toast-message"></div>
        </div>
        <button class="toast-close" aria-label="Kapat">&times;</button>
        <div class="toast-progress" style="animation-duration: ${computedDuration}ms;"></div>
    `;
    toast.querySelector('.toast-message').textContent = message;

    let dismissTimer;
    const removeToast = () => {
        if (!toast.isConnected) return;
        clearTimeout(dismissTimer);
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 220);
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);

    dismissTimer = setTimeout(removeToast, computedDuration);

    // Üzerine gelince zamanlayıcıyı durdur, ayrılınca kalan süreyle devam et
    const progressEl = toast.querySelector('.toast-progress');
    toast.addEventListener('mouseenter', () => {
        clearTimeout(dismissTimer);
        progressEl.style.animationPlayState = 'paused';
    });
    toast.addEventListener('mouseleave', () => {
        progressEl.style.animationPlayState = 'running';
        dismissTimer = setTimeout(removeToast, 2000);
    });

    container.appendChild(toast);
}

// ============================================
// ÖZEL ONAY KUTUSU (infobox) — window.confirm() yerine kullanılır
// ============================================
function showConfirm(message, options = {}) {
    const {
        title = 'Emin misiniz?',
        icon = '⚠️',
        okText = 'Tamam',
        cancelText = 'İptal',
        danger = true
    } = options;

    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        if (!modal) {
            // Modal DOM'da yoksa tarayıcının yerleşik onayına geri düş
            resolve(window.confirm(message));
            return;
        }

        const iconEl = document.getElementById('confirmModalIcon');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const okBtn = document.getElementById('confirmModalOkBtn');
        const cancelBtn = document.getElementById('confirmModalCancelBtn');

        iconEl.textContent = icon;
        titleEl.textContent = title;
        messageEl.textContent = message;
        okBtn.textContent = okText;
        cancelBtn.textContent = cancelText;
        okBtn.className = danger ? 'btn-danger' : 'btn-primary';

        let settled = false;
        const cleanup = (result) => {
            if (settled) return;
            settled = true;
            modal.classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onOverlayClick);
            document.removeEventListener('keydown', onKeydown);
            resolve(result);
        };

        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);
        const onOverlayClick = (e) => { if (e.target === modal) cleanup(false); };
        const onKeydown = (e) => {
            if (e.key === 'Escape') cleanup(false);
            else if (e.key === 'Enter') cleanup(true);
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        modal.addEventListener('click', onOverlayClick);
        document.addEventListener('keydown', onKeydown);

        modal.classList.add('active');
        okBtn.focus();
    });
}

// Silah Listesi
const WEAPON_LIST = {
    331: "Brassknuckle",
    333: "Golfclub",
    334: "Nightstick",
    335: "Knife",
    336: "Bat",
    337: "Shovel",
    338: "Poolstick",
    339: "Katana",
    341: "Chainsaw",
    346: "Colt 45",
    347: "Silenced",
    348: "Deagle",
    349: "Shotgun",
    350: "Sawed-off",
    351: "Combat Shotgun",
    352: "Uzi",
    353: "MP5",
    355: "AK-47",
    356: "M4",
    357: "Rifle",
    358: "Sniper",
    359: "Rocket Launcher",
    360: "Rocket Launcher HS",
    361: "Flamethrower",
    362: "Minigun",
    363: "Grenade",
    365: "Teargas",
    366: "Molotov",
    367: "Satchel",
    368: "Spraycan",
    369: "Fire Extinguisher",
    370: "Camera",
    371: "Dildo",
    372: "Dildo 2",
    373: "Vibrator",
    374: "Flowers",
    375: "Cane",
    376: "Grenade",
    377: "Tear Gas",
    378: "Molotov"
};

// Veri yapısı
const modData = {
    vehicles: new Map(),
    characters: new Map(),
    objects: new Map(),
    weapons: new Map()
};

// Gerekli dosyaları (DFF/TXD) henüz tamamlanmamış modlar tamamlanana kadar burada
// bekler ve "Yüklenen Modlar" listesinde GÖSTERİLMEZ. Eksik dosya tamamlandığında
// otomatik olarak modData'ya taşınır.
const pendingModData = {
    vehicles: new Map(),
    characters: new Map(),
    objects: new Map(),
    weapons: new Map()
};

// Her kategori için zorunlu dosya uzantıları. Obje kategorisinde COL isteğe bağlıdır,
// bu yüzden zorunlular listesine dahil edilmez.
const REQUIRED_EXTENSIONS = {
    vehicles: ['dff', 'txd'],
    characters: ['dff', 'txd'],
    weapons: ['dff', 'txd'],
    objects: ['dff', 'txd']
};

function isModComplete(mod, category) {
    const required = REQUIRED_EXTENSIONS[category] || [];
    return required.every(ext => !!mod.files[ext]);
}

function getMissingExtensions(mod, category) {
    const required = REQUIRED_EXTENSIONS[category] || [];
    return required.filter(ext => !mod.files[ext]);
}

// Verilen key için (aktif veya bekleyen listede) mevcut mod kaydını döndürür
function getExistingModEntry(category, key) {
    if (modData[category].has(key)) return { store: 'active', entry: modData[category].get(key) };
    if (pendingModData[category].has(key)) return { store: 'pending', entry: pendingModData[category].get(key) };
    return null;
}

// İndirilecek ZIP dosyasının adı (kullanıcı önizleme ekranında değiştirebilir)
let outputFileName = 'MTA_ModLoader';

// Her kategori için aktif arama/filtre terimi ("Arama/filtre kutusu" özelliği)
const modSearchTerms = { vehicles: '', characters: '', objects: '', weapons: '' };

// "Son eklenen" vurgusu için: bir sonraki render'da hangi mod anahtarlarının
// yeşil highlight animasyonuyla gösterileceğini tutar. Render sonrası temizlenir.
const recentlyAddedKeys = {
    vehicles: new Set(),
    characters: new Set(),
    objects: new Set(),
    weapons: new Set()
};

// Kategori bazında toplu ID atarken önerilen başlangıç ID'si.
// Bu sadece bir öneri; kullanıcı MTA Wiki'deki gerçek ID listesine göre değiştirebilir:
// Araçlar: https://wiki.multitheftauto.com/wiki/Vehicle_IDs
// Karakterler: https://wiki.multitheftauto.com/wiki/Character_Skins
// Objeler: https://dev.prineside.com/en/gtasa_samp_model_id/
const BULK_ID_SUGGESTIONS = { vehicles: 400, characters: 0, objects: 1300 };

// Toplu ID atama modalı açıkken hangi kategori/mod anahtarları üzerinde
// işlem yapılacağını tutan geçici durum
let bulkIdContext = { category: null, modIds: [] };

// Loader ayarları
const DEFAULT_LOADER_SETTINGS = {
    style: 'panel',
    primaryColor: '#2196F3',
    bgColor: '#222222',
    textColor: '#FFFFFF',
    position: 'bottom',
    barWidth: 40,
    fontSize: 14,
    modDelay: 1,
    nativeDownload: false,
    modToggleEnabled: false,
    fullscreenBgEnabled: false,
    bgSlideInterval: 5,
    bgAudioVolume: 60,
    bgOpacity: 100,
    smoothAnimation: true,
    shadowEffect: true,
    musicPanelPosition: 'aboveLoader',
    musicBgColor: '#101827',
    musicAccentColor: '#2196F3',
    musicTextColor: '#e2e8f0',
    musicOpacity: 92,
    musicShadowEffect: true,
    hideHudDuringLoading: true
};

const loaderSettings = { ...DEFAULT_LOADER_SETTINGS };

// Tam ekran mod loader için seçilen görseller (en fazla 5 adet).
// Her öğe: { file: File, dataUrl: string }
const MAX_BG_IMAGES = 5;
let bgImages = [];

// Tam ekran mod loader'a eşlik eden opsiyonel MP3 arka plan müzikleri (birden fazla olabilir).
// Her öğe: { file: File, name: string } -- name, oyuncuya müzik panelinde gösterilen,
// kullanıcının değiştirebildiği parça adıdır (varsayılan olarak dosya adından türetilir).
const MAX_BG_AUDIO = 8;
let bgAudioTracks = [];

// Dosya adından uzantısız, okunabilir bir varsayılan parça adı türetir (ör. "song.mp3" -> "song").
function deriveDefaultTrackName(fileName) {
    const withoutExt = fileName.replace(/\.[^./\\]+$/, '');
    return withoutExt || fileName;
}

// Seçilen mp3 dosyalarını "Loader/bgmusicN.uzantı" yollarıyla eşleştirir.
// Hem Lua script üretiminde hem de meta.xml/ZIP paketlemede kullanılır.
function getBgAudioEntries() {
    return bgAudioTracks.map((track, idx) => {
        const rawExt = (track.file.name.split('.').pop() || 'mp3').toLowerCase();
        const ext = rawExt === 'mp3' ? 'mp3' : 'mp3';
        return { path: `Loader/bgmusic${idx + 1}.${ext}`, fileName: `bgmusic${idx + 1}.${ext}`, file: track.file };
    });
}

// Yüklenen arkaplan görsellerini "Loader/bgN.uzantı" yollarıyla eşleştirir.
// Hem Lua script üretiminde hem de meta.xml/ZIP paketlemede kullanılır.
function getBgImageEntries() {
    return bgImages.map((img, idx) => {
        const rawExt = (img.file.name.split('.').pop() || 'jpg').toLowerCase();
        const ext = /^(jpg|jpeg|png|bmp)$/.test(rawExt) ? rawExt : 'jpg';
        return { path: `Loader/bg${idx + 1}.${ext}`, fileName: `bg${idx + 1}.${ext}`, file: img.file };
    });
}

// Hex renk kodunu RGB'ye çevir (MTA tocolor() için)
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

// Başlangıç
document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupFileInputs();
    setupDragDrop();
    setupBgImageInputs();
    setupBgAudioInput();
    setupDarkMode();
    updateLoaderPreview();
    ['vehicles', 'characters', 'objects', 'weapons'].forEach(updateModsList);
});

// ============================================
// KARANLIK MOD
// ============================================
function setupDarkMode() {
    let saved = null;
    try {
        saved = localStorage.getItem('mtaModLoaderDarkMode');
    } catch (e) {
        // localStorage erişilemiyorsa (örn. bazı gizli sekme ayarları) sessizce varsayılana düş
    }
    const enabled = saved === '1';
    if (enabled) document.body.classList.add('dark-mode');
    updateDarkModeButtonLabel(enabled);
}

function toggleDarkMode() {
    const enabled = document.body.classList.toggle('dark-mode');
    try {
        localStorage.setItem('mtaModLoaderDarkMode', enabled ? '1' : '0');
    } catch (e) {
        // saklama başarısız olsa da geçerli oturumda tema değişmeye devam eder
    }
    updateDarkModeButtonLabel(enabled);
}

function updateDarkModeButtonLabel(enabled) {
    const btn = document.getElementById('darkModeToggleBtn');
    if (!btn) return;
    btn.textContent = enabled ? '☀️ Aydınlık Mod' : '🌙 Karanlık Mod';
}

// Ayarlar bölümlerindeki "ℹ️ Bilgi" butonu: açıklama metnini aç/kapat
function toggleInfo(descId, btn) {
    const desc = document.getElementById(descId);
    if (!desc) return;

    const isHidden = desc.hasAttribute('hidden');
    if (isHidden) {
        desc.removeAttribute('hidden');
        if (btn) {
            btn.classList.add('active');
            btn.textContent = '✕ Kapat';
        }
    } else {
        desc.setAttribute('hidden', '');
        if (btn) {
            btn.classList.remove('active');
            btn.textContent = 'ℹ️ Bilgi';
        }
    }
}

// Tab sistemi
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Dosya inputu ayarları
function setupFileInputs() {
    const categories = ['vehicles', 'characters', 'objects', 'weapons'];
    
    categories.forEach(category => {
        const fileInput = document.getElementById(`${category}FileInput`);
        fileInput.addEventListener('change', function(e) {
            handleFiles(e.target.files, category);
            e.target.value = '';
        });
    });
}

// Drag-drop ayarları
function setupDragDrop() {
    const categories = ['vehicles', 'characters', 'objects', 'weapons'];
    
    categories.forEach(category => {
        const uploadArea = document.getElementById(`${category}UploadArea`);
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        uploadArea.addEventListener('dragenter', () => {
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files, category);
        });
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// ============================================
// TAM EKRAN ARKAPLAN SLAYTI - GÖRSEL SLOTLARI
// ============================================
let bgImageFileInput;

function setupBgImageInputs() {
    bgImageFileInput = document.getElementById('bgImageFileInput');
    if (!bgImageFileInput) return;

    bgImageFileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;

        let addedCount = 0;
        let rejectedType = 0;
        let rejectedFull = 0;
        let mismatchedSize = 0;
        let pending = 0;
        const addedNames = [];

        const finalizeIfDone = () => {
            if (pending > 0) return;
            if (addedCount > 0) {
                showToast(addedCount === 1
                    ? `"${addedNames[0]}" arkaplan görseli olarak eklendi.`
                    : `${addedCount} adet arkaplan görseli eklendi.`, 'success');
            }
            if (mismatchedSize > 0) {
                showToast(`${mismatchedSize} görsel 1920x1080 boyutunda değil; yine de eklendi, farklı çözünürlükte de düzgün gösterilecektir.`, 'warning');
            }
            if (rejectedType > 0) {
                showToast('Bazı dosyalar görsel olmadığı için eklenmedi.', 'error');
            }
            if (rejectedFull > 0) {
                showToast(`En fazla ${MAX_BG_IMAGES} arkaplan görseli ekleyebilirsiniz.`, 'warning');
            }
        };

        files.forEach(file => {
            // Bu parti içinde şimdiye kadar kuyruğa alınanları da sayarak sınırı kontrol et.
            if (bgImages.length + pending >= MAX_BG_IMAGES) {
                rejectedFull++;
                return;
            }
            if (!file.type.startsWith('image/')) {
                rejectedType++;
                return;
            }

            pending++;
            const reader = new FileReader();
            reader.onload = function(ev) {
                bgImages.push({ file, dataUrl: ev.target.result });
                addedCount++;
                addedNames.push(file.name);
                renderBgImageSlots();
                updateLoaderPreview();

                // Önerilen 1920x1080 boyutuna uymayan görseller için bilgilendirme (engelleme yok,
                // çünkü oyun içinde görsel her çözünürlüğe "cover" mantığıyla otomatik ölçeklenir).
                const checkImg = new Image();
                checkImg.onload = function() {
                    if (checkImg.naturalWidth !== 1920 || checkImg.naturalHeight !== 1080) {
                        mismatchedSize++;
                    }
                    pending--;
                    finalizeIfDone();
                };
                checkImg.onerror = function() {
                    pending--;
                    finalizeIfDone();
                };
                checkImg.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });

        if (pending === 0) finalizeIfDone();
    });

    renderBgImageSlots();
}

function triggerBgImagePicker() {
    if (bgImages.length >= MAX_BG_IMAGES) {
        showToast(`En fazla ${MAX_BG_IMAGES} arkaplan görseli ekleyebilirsiniz.`, 'warning');
        return;
    }
    bgImageFileInput.click();
}

function removeBgImage(index) {
    bgImages.splice(index, 1);
    renderBgImageSlots();
    updateLoaderPreview();
}

// Slotlar tek bir "resim ekle" kutusuyla başlar; her resim eklendikçe bir sonraki
// boş slot otomatik olarak belirir (en fazla MAX_BG_IMAGES adede kadar). Yani
// varsayılan olarak tek resim slotu görünür, isteyen kullanıcı üzerine tıklayarak
// birden fazla resim ekleyebilir.
function renderBgImageSlots() {
    const container = document.getElementById('bgImageSlots');
    if (!container) return;

    let html = '';
    bgImages.forEach((img, i) => {
        html += `
            <div class="bg-image-slot filled">
                <img src="${img.dataUrl}" alt="Arkaplan ${i + 1}">
                <span class="bg-image-slot-index">${i + 1}</span>
                <button type="button" class="bg-image-slot-remove" onclick="removeBgImage(${i})" title="Kaldır">&times;</button>
            </div>
        `;
    });

    if (bgImages.length < MAX_BG_IMAGES) {
        html += `
            <div class="bg-image-slot" onclick="triggerBgImagePicker()">
                <div class="bg-image-slot-placeholder">
                    <span class="plus-icon">+</span>
                    <span>${bgImages.length === 0 ? 'Resim Ekle' : `Resim ${bgImages.length + 1}`}</span>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ============================================
// TAM EKRAN MOD LOADER - OPSİYONEL MP3 ARKA PLAN MÜZİKLERİ (BİRDEN FAZLA)
// ============================================
let bgAudioFileInput;

function setupBgAudioInput() {
    bgAudioFileInput = document.getElementById('bgAudioFileInput');
    if (!bgAudioFileInput) return;

    bgAudioFileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;

        let addedCount = 0;
        let rejectedType = 0;
        let rejectedFull = 0;

        files.forEach(file => {
            if (bgAudioTracks.length >= MAX_BG_AUDIO) {
                rejectedFull++;
                return;
            }
            const isMp3 = file.type === 'audio/mpeg' || /\.mp3$/i.test(file.name);
            if (!isMp3) {
                rejectedType++;
                return;
            }
            bgAudioTracks.push({ file, name: deriveDefaultTrackName(file.name) });
            addedCount++;
        });

        if (addedCount > 0) {
            renderBgAudioList();
            showToast(addedCount === 1
                ? `"${files[0].name}" arka plan müziği olarak eklendi.`
                : `${addedCount} adet arka plan müziği eklendi.`, 'success');
        }
        if (rejectedType > 0) {
            showToast('Bazı dosyalar MP3 olmadığı için eklenmedi.', 'error');
        }
        if (rejectedFull > 0) {
            showToast(`En fazla ${MAX_BG_AUDIO} müzik parçası ekleyebilirsiniz.`, 'warning');
        }
    });

    renderBgAudioList();
}

function triggerBgAudioPicker() {
    if (bgAudioTracks.length >= MAX_BG_AUDIO) {
        showToast(`En fazla ${MAX_BG_AUDIO} müzik parçası ekleyebilirsiniz.`, 'warning');
        return;
    }
    if (bgAudioFileInput) bgAudioFileInput.click();
}

function removeBgAudioTrack(index) {
    bgAudioTracks.splice(index, 1);
    renderBgAudioList();
}

// Oyuncuya müzik panelinde gösterilecek parça adını günceller; boş bırakılırsa
// dosya adından türetilen varsayılan isme geri döner.
function updateBgAudioTrackName(index, newName) {
    const track = bgAudioTracks[index];
    if (!track) return;
    const trimmed = newName.trim();
    track.name = trimmed || deriveDefaultTrackName(track.file.name);
    renderBgAudioList();
}

// Müzik parçalarını liste halinde gösterir; en az bir parça olduğunda "Ekle"
// butonu listenin altında kalır, hiç parça yokken tek bir bilgi satırı + ekle
// butonu gösterilir. Her satırda parçaya isim vermek için düzenlenebilir bir
// alan ve altında orijinal dosya adı bulunur.
function renderBgAudioList() {
    const listEl = document.getElementById('bgAudioList');
    const addBtn = document.getElementById('bgAudioPickBtn');
    if (!listEl) return;

    if (bgAudioTracks.length === 0) {
        listEl.innerHTML = `<p class="bg-audio-empty" id="bgAudioFileName">Seçilmedi — yükleme ekranı sessiz olur</p>`;
    } else {
        listEl.innerHTML = bgAudioTracks.map((track, i) => {
            const safeName = (track.name || '').replace(/"/g, '&quot;');
            const safeFileName = track.file.name.replace(/"/g, '&quot;');
            return `
            <div class="bg-audio-track-row">
                <div class="bg-audio-track-main">
                    <span class="bg-audio-track-index">${i + 1}</span>
                    <input type="text" class="bg-audio-track-name-input" value="${safeName}"
                           maxlength="60" placeholder="Parça adı"
                           onchange="updateBgAudioTrackName(${i}, this.value)">
                    <button type="button" class="btn-bg-audio-remove" onclick="removeBgAudioTrack(${i})" title="Kaldır">✕</button>
                </div>
                <div class="bg-audio-track-file" title="${safeFileName}">🎵 ${track.file.name}</div>
            </div>
        `;
        }).join('');
    }

    if (addBtn) {
        addBtn.textContent = bgAudioTracks.length === 0 ? '🎵 MP3 Seç' : '🎵 Başka MP3 Ekle';
        addBtn.disabled = bgAudioTracks.length >= MAX_BG_AUDIO;
    }
}

// Ayarları varsayılana sıfırla
async function resetSettings() {
    const confirmed = await showConfirm(
        'Tüm script ayarlarını varsayılana sıfırlamak istediğinize emin misiniz?',
        { title: 'Ayarları Sıfırla', icon: '↺', okText: 'Sıfırla' }
    );
    if (!confirmed) {
        return;
    }

    document.getElementById('advancedLoaderToggle').checked = !DEFAULT_LOADER_SETTINGS.nativeDownload;
    document.getElementById('modToggleToggle').checked = DEFAULT_LOADER_SETTINGS.modToggleEnabled;
    document.getElementById('loaderStyle').value = DEFAULT_LOADER_SETTINGS.style;
    document.getElementById('primaryColor').value = DEFAULT_LOADER_SETTINGS.primaryColor;
    document.getElementById('bgColor').value = DEFAULT_LOADER_SETTINGS.bgColor;
    document.getElementById('textColor').value = DEFAULT_LOADER_SETTINGS.textColor;
    document.getElementById('loaderPosition').value = DEFAULT_LOADER_SETTINGS.position;
    document.getElementById('barWidthRange').value = DEFAULT_LOADER_SETTINGS.barWidth;
    document.getElementById('fontSizeRange').value = DEFAULT_LOADER_SETTINGS.fontSize;
    document.getElementById('modDelayRange').value = DEFAULT_LOADER_SETTINGS.modDelay;
    document.getElementById('fullscreenBgToggle').checked = DEFAULT_LOADER_SETTINGS.fullscreenBgEnabled;
    document.getElementById('bgSlideIntervalRange').value = DEFAULT_LOADER_SETTINGS.bgSlideInterval;
    const bgAudioVolumeRange = document.getElementById('bgAudioVolumeRange');
    if (bgAudioVolumeRange) bgAudioVolumeRange.value = DEFAULT_LOADER_SETTINGS.bgAudioVolume;
    const bgOpacityRange = document.getElementById('bgOpacityRange');
    if (bgOpacityRange) bgOpacityRange.value = DEFAULT_LOADER_SETTINGS.bgOpacity;
    const smoothAnimationToggle = document.getElementById('smoothAnimationToggle');
    if (smoothAnimationToggle) smoothAnimationToggle.checked = DEFAULT_LOADER_SETTINGS.smoothAnimation;
    const shadowEffectToggle = document.getElementById('shadowEffectToggle');
    if (shadowEffectToggle) shadowEffectToggle.checked = DEFAULT_LOADER_SETTINGS.shadowEffect;

    const musicPanelPositionEl = document.getElementById('musicPanelPosition');
    if (musicPanelPositionEl) musicPanelPositionEl.value = DEFAULT_LOADER_SETTINGS.musicPanelPosition;
    const musicBgColorEl = document.getElementById('musicBgColor');
    if (musicBgColorEl) musicBgColorEl.value = DEFAULT_LOADER_SETTINGS.musicBgColor;
    const musicAccentColorEl = document.getElementById('musicAccentColor');
    if (musicAccentColorEl) musicAccentColorEl.value = DEFAULT_LOADER_SETTINGS.musicAccentColor;
    const musicTextColorEl = document.getElementById('musicTextColor');
    if (musicTextColorEl) musicTextColorEl.value = DEFAULT_LOADER_SETTINGS.musicTextColor;
    const musicOpacityEl = document.getElementById('musicOpacityRange');
    if (musicOpacityEl) musicOpacityEl.value = DEFAULT_LOADER_SETTINGS.musicOpacity;
    const musicShadowEffectEl = document.getElementById('musicShadowEffectToggle');
    if (musicShadowEffectEl) musicShadowEffectEl.checked = DEFAULT_LOADER_SETTINGS.musicShadowEffect;
    const hideHudToggleEl = document.getElementById('hideHudToggle');
    if (hideHudToggleEl) hideHudToggleEl.checked = DEFAULT_LOADER_SETTINGS.hideHudDuringLoading;

    updateLoaderPreview();
}

// Loader ön izlemesini güncelle
function updateLoaderPreview() {
    const style = document.getElementById('loaderStyle').value;
    const preview = document.getElementById('loaderPreview');
    
    const primaryColor = document.getElementById('primaryColor').value;
    const bgColor = document.getElementById('bgColor').value;
    const textColor = document.getElementById('textColor').value;
    const position = document.getElementById('loaderPosition').value;
    const barWidth = document.getElementById('barWidthRange').value;
    const fontSize = document.getElementById('fontSizeRange').value;
    const modDelay = document.getElementById('modDelayRange').value;
    const nativeDownload = !document.getElementById('advancedLoaderToggle').checked;
    const modToggleEnabled = document.getElementById('modToggleToggle').checked;
    const fullscreenBgEnabled = document.getElementById('fullscreenBgToggle').checked;
    const bgSlideInterval = document.getElementById('bgSlideIntervalRange').value;
    const bgAudioVolumeEl = document.getElementById('bgAudioVolumeRange');
    const bgAudioVolume = bgAudioVolumeEl ? bgAudioVolumeEl.value : DEFAULT_LOADER_SETTINGS.bgAudioVolume;
    const bgOpacityEl = document.getElementById('bgOpacityRange');
    const bgOpacity = bgOpacityEl ? bgOpacityEl.value : DEFAULT_LOADER_SETTINGS.bgOpacity;
    const smoothAnimationEl = document.getElementById('smoothAnimationToggle');
    const smoothAnimation = smoothAnimationEl ? smoothAnimationEl.checked : DEFAULT_LOADER_SETTINGS.smoothAnimation;
    const shadowEffectEl = document.getElementById('shadowEffectToggle');
    const shadowEffect = shadowEffectEl ? shadowEffectEl.checked : DEFAULT_LOADER_SETTINGS.shadowEffect;

    const musicPanelPositionEl = document.getElementById('musicPanelPosition');
    const musicPanelPosition = musicPanelPositionEl ? musicPanelPositionEl.value : DEFAULT_LOADER_SETTINGS.musicPanelPosition;
    const musicBgColorEl = document.getElementById('musicBgColor');
    const musicBgColor = musicBgColorEl ? musicBgColorEl.value : DEFAULT_LOADER_SETTINGS.musicBgColor;
    const musicAccentColorEl = document.getElementById('musicAccentColor');
    const musicAccentColor = musicAccentColorEl ? musicAccentColorEl.value : DEFAULT_LOADER_SETTINGS.musicAccentColor;
    const musicTextColorEl = document.getElementById('musicTextColor');
    const musicTextColor = musicTextColorEl ? musicTextColorEl.value : DEFAULT_LOADER_SETTINGS.musicTextColor;
    const musicOpacityEl = document.getElementById('musicOpacityRange');
    const musicOpacity = musicOpacityEl ? musicOpacityEl.value : DEFAULT_LOADER_SETTINGS.musicOpacity;
    const musicShadowEffectEl = document.getElementById('musicShadowEffectToggle');
    const musicShadowEffect = musicShadowEffectEl ? musicShadowEffectEl.checked : DEFAULT_LOADER_SETTINGS.musicShadowEffect;
    const hideHudToggleEl = document.getElementById('hideHudToggle');
    const hideHudDuringLoading = hideHudToggleEl ? hideHudToggleEl.checked : DEFAULT_LOADER_SETTINGS.hideHudDuringLoading;

    document.getElementById('primaryColorValue').textContent = primaryColor;
    document.getElementById('bgColorValue').textContent = bgColor;
    document.getElementById('textColorValue').textContent = textColor;
    document.getElementById('barWidthValue').textContent = `${barWidth}%`;
    document.getElementById('fontSizeValue').textContent = `${fontSize}px`;
    document.getElementById('modDelayValue').textContent = modDelay;
    document.getElementById('bgSlideIntervalValue').textContent = bgSlideInterval;
    const bgAudioVolumeValueEl = document.getElementById('bgAudioVolumeValue');
    if (bgAudioVolumeValueEl) bgAudioVolumeValueEl.textContent = `${bgAudioVolume}%`;
    const bgOpacityValueEl = document.getElementById('bgOpacityValue');
    if (bgOpacityValueEl) bgOpacityValueEl.textContent = `${bgOpacity}%`;
    const musicBgColorValueEl = document.getElementById('musicBgColorValue');
    if (musicBgColorValueEl) musicBgColorValueEl.textContent = musicBgColor;
    const musicAccentColorValueEl = document.getElementById('musicAccentColorValue');
    if (musicAccentColorValueEl) musicAccentColorValueEl.textContent = musicAccentColor;
    const musicTextColorValueEl = document.getElementById('musicTextColorValue');
    if (musicTextColorValueEl) musicTextColorValueEl.textContent = musicTextColor;
    const musicOpacityValueEl = document.getElementById('musicOpacityValue');
    if (musicOpacityValueEl) musicOpacityValueEl.textContent = `${musicOpacity}%`;

    loaderSettings.style = style;
    loaderSettings.primaryColor = primaryColor;
    loaderSettings.bgColor = bgColor;
    loaderSettings.textColor = textColor;
    loaderSettings.position = position;
    loaderSettings.barWidth = parseInt(barWidth, 10);
    loaderSettings.fontSize = parseInt(fontSize, 10);
    loaderSettings.modDelay = parseFloat(modDelay);
    loaderSettings.nativeDownload = nativeDownload;
    loaderSettings.modToggleEnabled = modToggleEnabled;
    loaderSettings.fullscreenBgEnabled = fullscreenBgEnabled;
    loaderSettings.bgSlideInterval = parseFloat(bgSlideInterval);
    loaderSettings.bgAudioVolume = parseInt(bgAudioVolume, 10);
    loaderSettings.bgOpacity = parseInt(bgOpacity, 10);
    loaderSettings.smoothAnimation = smoothAnimation;
    loaderSettings.shadowEffect = shadowEffect;
    loaderSettings.musicPanelPosition = musicPanelPosition;
    loaderSettings.musicBgColor = musicBgColor;
    loaderSettings.musicAccentColor = musicAccentColor;
    loaderSettings.musicTextColor = musicTextColor;
    loaderSettings.musicOpacity = parseInt(musicOpacity, 10);
    loaderSettings.musicShadowEffect = musicShadowEffect;
    loaderSettings.hideHudDuringLoading = hideHudDuringLoading;

    // Ayar rozetleri: her switch kendi anahtar konumunu doğrudan yansıtır
    // (anahtar açıksa "Aktif", kapalıysa "Pasif" - başka bir mantığa göre ters çevrilmez).
    const setStatusBadge = (id, isOn) => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.textContent = isOn ? 'Aktif' : 'Pasif';
        badge.classList.toggle('status-badge-on', isOn);
        badge.classList.toggle('status-badge-off', !isOn);
    };
    setStatusBadge('advancedLoaderStatusBadge', !nativeDownload);
    setStatusBadge('modToggleStatusBadge', modToggleEnabled);
    setStatusBadge('fullscreenBgStatusBadge', fullscreenBgEnabled);

    // Arkaplan slaytı gövdesi sadece açıkken (ve native indirme kapalıyken) etkileşimli olsun
    const fullscreenBgBody = document.getElementById('fullscreenBgBody');
    if (fullscreenBgBody) fullscreenBgBody.classList.toggle('is-off', !fullscreenBgEnabled);

    // Native indirme açıkken loader tasarım ayarları geçersiz kalır -> görsel olarak devre dışı bırak
    const disableIds = ['loaderStyleSection', 'colorsSection', 'positionSection', 'behaviorSection', 'previewSection', 'fullscreenBgSection'];
    disableIds.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.classList.toggle('is-disabled', nativeDownload);
    });

    if (nativeDownload) {
        return;
    }
    
    if (fullscreenBgEnabled && bgImages.length > 0) {
        preview.style.background = `url(${bgImages[0].dataUrl}) center / cover no-repeat`;
    } else {
        preview.style.background = bgColor;
    }
    preview.style.alignItems = position === 'top' ? 'flex-start' : (position === 'center' ? 'center' : 'flex-end');
    
    if (style === 'panel') {
        preview.innerHTML = `
            <div style="width: ${barWidth}%; margin: 0 auto; background: ${bgColor}; padding: 18px 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.35);">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                    <span style="color: ${textColor}; font-size: ${fontSize}px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Test Modu</span>
                    <span style="color: ${primaryColor}; font-size: ${Math.round(fontSize * 1.05)}px; font-weight: 700; white-space: nowrap;">%45</span>
                </div>
                <div style="position: relative; width: 100%; height: 10px; background: rgba(0,0,0,0.35); overflow: hidden; margin: 10px 0 8px;">
                    <div style="height: 100%; width: 65%; background: ${primaryColor}; animation: loadingHorizontal 2s infinite;"></div>
                </div>
                <div style="color: ${textColor}; opacity: 0.65; font-size: ${Math.round(fontSize * 0.78)}px; font-weight: 600;">45.00 MB</div>
            </div>
        `;
    } else if (style === 'frame') {
        const border = 2;
        preview.innerHTML = `
            <div style="width: ${barWidth}%; margin: 0 auto; text-align: center;">
                <div style="color: ${textColor}; font-size: ${fontSize}px; font-weight: 700; margin-bottom: 8px; white-space: nowrap;">Test Modu &nbsp;-&nbsp; 45.00 MB &nbsp;-&nbsp; %45</div>
                <div style="width: 100%; height: 16px; background: ${primaryColor}; padding: ${border}px; box-sizing: border-box;">
                    <div style="position: relative; width: 100%; height: 100%; background: ${bgColor}; overflow: hidden;">
                        <div style="height: 100%; width: 65%; background: ${primaryColor}; animation: loadingHorizontal 2s infinite;"></div>
                    </div>
                </div>
            </div>
        `;
    } else if (style === 'segmented') {
        const segmentCount = 24;
        let segmentsHtml = '';
        for (let i = 0; i < segmentCount; i++) {
            const filled = i < Math.round(segmentCount * 0.45);
            segmentsHtml += `<div style="flex: 1; height: 18px; background: ${filled ? primaryColor : bgColor};"></div>`;
        }
        preview.innerHTML = `
            <div style="width: ${barWidth}%; margin: 0 auto; text-align: center;">
                <div style="color: ${textColor}; font-size: ${fontSize}px; font-weight: 700; margin-bottom: 8px; white-space: nowrap;">Test Modu &nbsp;-&nbsp; 45.00 MB &nbsp;-&nbsp; %45</div>
                <div style="display: flex; gap: 3px; width: 100%;">${segmentsHtml}</div>
            </div>
        `;
    } else if (style === 'sideLabel') {
        preview.innerHTML = `
            <div style="width: ${barWidth}%; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
                    <span style="color: ${primaryColor}; font-size: ${Math.round(fontSize * 1.8)}px; font-weight: 800; white-space: nowrap;">%45</span>
                    <div style="display: flex; flex-direction: column; overflow: hidden;">
                        <span style="color: ${textColor}; font-size: ${Math.round(fontSize * 0.9)}px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Test Modu</span>
                        <span style="color: ${textColor}; opacity: 0.65; font-size: ${Math.round(fontSize * 0.65)}px; font-weight: 600; white-space: nowrap;">45.00 MB</span>
                    </div>
                </div>
                <div style="position: relative; width: 100%; height: 10px; background: ${bgColor}; overflow: hidden;">
                    <div style="height: 100%; width: 65%; background: ${primaryColor}; animation: loadingHorizontal 2s infinite;"></div>
                </div>
            </div>
        `;
    }
    
    addAnimationStyles();
}

function addAnimationStyles() {
    if (!document.getElementById('previewAnimations')) {
        const style = document.createElement('style');
        style.id = 'previewAnimations';
        style.textContent = `
            @keyframes loadingHorizontal {
                0%, 100% { width: 0%; }
                50% { width: 100%; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Dosya işleme
function handleFiles(files, category) {
    const fileArray = Array.from(files);
    const validExtensions = category === 'objects' ? ['dff', 'txd', 'col'] : ['dff', 'txd'];
    const touchedKeys = new Set();

    fileArray.forEach(file => {
        const filename = file.name;
        const numericMatch = filename.match(/^(\d+)\.(dff|txd|col)$/i);
        const looseMatch = filename.match(/^(.+)\.(dff|txd|col)$/i);
        
        if (numericMatch && validExtensions.includes(numericMatch[2].toLowerCase())) {
            const modId = numericMatch[1];
            const extension = numericMatch[2].toLowerCase();
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const key = modId;

            const existing = getExistingModEntry(category, key);
            const modEntry = existing ? existing.entry : {
                id: modId,
                name: `${category === 'objects' ? 'Obje' : category === 'weapons' ? 'Silah' : category === 'vehicles' ? 'Araç' : 'Karakter'} ${modId}`,
                files: {},
                sizes: {},
                weaponId: null,
                weaponName: null,
                needsId: false
            };

            modEntry.files[extension] = file;
            modEntry.sizes[extension] = sizeMB;

            // Tamlık kontrolü yapılana kadar geçici olarak kaydını koru
            if (existing && existing.store === 'active') {
                modData[category].set(key, modEntry);
            } else {
                pendingModData[category].set(key, modEntry);
            }

            touchedKeys.add(key);
        } else if (looseMatch && validExtensions.includes(looseMatch[2].toLowerCase())) {
            // Dosya adında sayısal ID yok (örn. "deagle.dff") -> ID'yi kullanıcı elle girecek
            const baseName = looseMatch[1];
            const extension = looseMatch[2].toLowerCase();
            const key = `noid_${baseName.toLowerCase()}`;
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

            const existing = getExistingModEntry(category, key);
            const modEntry = existing ? existing.entry : {
                id: '',
                name: `${category === 'objects' ? 'Obje' : category === 'weapons' ? 'Silah' : category === 'vehicles' ? 'Araç' : 'Karakter'} ${baseName}`,
                files: {},
                sizes: {},
                weaponId: null,
                weaponName: null,
                needsId: true
            };

            modEntry.files[extension] = file;
            modEntry.sizes[extension] = sizeMB;

            if (existing && existing.store === 'active') {
                modData[category].set(key, modEntry);
            } else {
                pendingModData[category].set(key, modEntry);
            }

            touchedKeys.add(key);
        } else {
            const validExts = category === 'objects' ? '.dff, .txd, .col' : '.dff, .txd';
            showToast(`Hatalı dosya adı: ${filename}\nFormat: 512${validExts} olmalıdır.`, 'error');
        }
    });

    // Zorunlu dosyaların (DFF + TXD) tamamı yüklendi mi kontrol et.
    // Tamamsa mod aktif listeye taşınır, değilse bekleyenlerde kalır ve uyarı verilir.
    const incompleteMessages = [];
    touchedKeys.forEach(key => {
        const existing = getExistingModEntry(category, key);
        if (!existing) return;
        const { entry } = existing;

        if (isModComplete(entry, category)) {
            pendingModData[category].delete(key);
            modData[category].set(key, entry);
            recentlyAddedKeys[category].add(key);
        } else {
            modData[category].delete(key);
            pendingModData[category].set(key, entry);

            const missing = getMissingExtensions(entry, category)
                .map(ext => ext.toUpperCase())
                .join(' ve ');
            const modLabel = entry.id ? `ID ${entry.id}` : entry.name;
            incompleteMessages.push(`${modLabel}: ${missing} dosyası eksik`);
        }
    });

    if (incompleteMessages.length > 0) {
        const categoryLabel = CATEGORY_LABELS[category] || category;
        showToast(
            `${categoryLabel} modu için zorunlu dosyaların (DFF + TXD) tamamı yüklenmedi, bu yüzden listeye eklenmedi:\n${incompleteMessages.join('\n')}\nEksik dosyayı ekleyince mod otomatik olarak listeye eklenecek.`,
            'warning'
        );
    }

    updateModsList(category);
}

// Tüm kategorilerdeki (Araç/Karakter/Obje/Silah) ID'leri toplar ve her ID'nin
// hangi mod(lar) tarafından kullanıldığını döndürür. Aynı ID farklı kategorilerde
// kullanılırsa (örn. bir Obje ile bir Silah aynı ID'yi paylaşırsa) bu, oyunda
// modellerin birbirinin üzerine yazılmasına sebep olur.
const CATEGORY_LABELS = { vehicles: 'Araç', characters: 'Karakter', objects: 'Obje', weapons: 'Silah' };

function getGlobalIdOwners() {
    const idOwners = new Map();
    ['vehicles', 'characters', 'objects', 'weapons'].forEach(category => {
        modData[category].forEach(mod => {
            if (!mod.id) return; // henüz ID girilmemiş modlar çakışma kontrolüne dahil edilmez
            if (!idOwners.has(mod.id)) idOwners.set(mod.id, []);
            idOwners.get(mod.id).push({ category, categoryLabel: CATEGORY_LABELS[category], name: mod.name });
        });
    });
    return idOwners;
}

// Script oluşturmadan hemen önce çalıştırılan kesin/otoriter kontrol
function findIdConflicts() {
    const idOwners = getGlobalIdOwners();
    const conflicts = [];
    idOwners.forEach((owners, id) => {
        if (owners.length > 1) conflicts.push({ id, owners });
    });
    return conflicts;
}

// Modlar listesini güncelle
function updateModsList(category) {
    const listElement = document.getElementById(`${category}List`);
    const mods = modData[category];
    const selectAllBox = document.getElementById(`${category}SelectAll`);

    // Sekme rozeti ve toplam boyut, arama filtresinden bağımsız olarak HER ZAMAN
    // tüm kategori üzerinden hesaplanır (filtre sadece görünürlüğü etkiler)
    updateTabCount(category, mods.size);
    updateCategoryTotalSize(category, mods);
    updateGrandTotal();

    if (mods.size === 0) {
        listElement.innerHTML = '<p class="empty-message">Henüz mod eklenmedi</p>';
        if (selectAllBox) selectAllBox.checked = false;
        return;
    }

    if (selectAllBox) selectAllBox.checked = false;

    const idOwners = getGlobalIdOwners();
    const searchTerm = (modSearchTerms[category] || '').trim().toLowerCase();
    const newKeys = recentlyAddedKeys[category];

    let html = '';
    let visibleCount = 0;

    mods.forEach((mod, modId) => {
        if (searchTerm) {
            const haystack = `${mod.id} ${mod.name}`.toLowerCase();
            if (!haystack.includes(searchTerm)) return;
        }
        visibleCount++;
        const dffSize = mod.sizes.dff || '0';
        const txdSize = mod.sizes.txd || '0';
        const colSize = mod.sizes.col || '0';
        const totalSize = (parseFloat(dffSize) + parseFloat(txdSize) + parseFloat(colSize)).toFixed(2);
        const fileList = Object.keys(mod.files).map(ext => ext.toUpperCase()).join(' + ');
        
        let weaponSelect = '';
        if (category === 'weapons') {
            const options = Object.entries(WEAPON_LIST).map(([id, name]) => {
                const selected = mod.weaponId === id ? 'selected' : '';
                return `<option value="${id}" ${selected}>${name} (${id})</option>`;
            }).join('');
            weaponSelect = `
                <select class="mod-item-weapon-select" onchange="updateModWeapon('${modId}', this.value)">
                    <option value="">Silah seçin...</option>
                    ${options}
                </select>
            `;
        }
        
        const idInputValue = mod.needsId ? '' : modId;
        const idPlaceholder = mod.needsId ? 'ID girin (örn: 512)' : '';

        const owners = mod.id ? idOwners.get(mod.id) : null;
        const hasConflict = !mod.needsId && owners && owners.length > 1;

        let idInputClass = 'mod-item-id-input';
        let idWarning = '';
        let modItemClass = 'mod-item';

        if (mod.needsId) {
            idInputClass += ' missing';
            idWarning = '<span class="mod-item-id-warning">⚠️ Dosya adında ID yok, ID girin</span>';
            modItemClass += ' needs-id';
        } else if (hasConflict) {
            idInputClass += ' conflict';
            const otherOwners = owners.filter(o => !(o.category === category && o.name === mod.name));
            const otherLabels = (otherOwners.length > 0 ? otherOwners : owners)
                .map(o => o.categoryLabel)
                .filter((label, idx, arr) => arr.indexOf(label) === idx)
                .join(', ');
            idWarning = `<span class="mod-item-id-warning conflict">⚠️ Bu ID başka bir modda kullanılıyor (${otherLabels})</span>`;
            modItemClass += ' id-conflict';
        }

        const isNew = newKeys.has(modId);
        if (isNew) modItemClass += ' mod-item-new';
        const newBadge = isNew ? '<span class="mod-item-new-badge">YENİ</span>' : '';

        html += `
            <div class="${modItemClass}">
                <div class="mod-item-checkbox-wrap">
                    <input type="checkbox" class="mod-item-checkbox" data-mod-id="${modId}" onchange="updateSelectAllState('${category}')">${newBadge}
                </div>
                <div class="mod-item-info">
                    <div class="mod-item-id-row">
                        🆔 ID: <input type="text" class="${idInputClass}" value="${idInputValue}" placeholder="${idPlaceholder}"
                               onchange="updateModId('${category}', '${modId}', this.value)">
                        ${idWarning}
                    </div>
                    <div class="mod-item-files">📁 ${fileList}</div>
                    <div class="mod-item-size">💾 ${totalSize} MB</div>
                </div>
                ${weaponSelect}
                <input type="text" class="mod-item-name-input" value="${mod.name}" 
                       onchange="updateModName('${category}', '${modId}', this.value)"
                       placeholder="Mod adını girin">
                <div class="mod-item-actions">
                    <button class="btn-icon delete" onclick="deleteMod('${category}', '${modId}')">🗑️</button>
                </div>
            </div>
        `;
    });

    if (visibleCount === 0) {
        listElement.innerHTML = `<p class="empty-message">"${modSearchTerms[category]}" ile eşleşen mod bulunamadı</p>`;
    } else {
        listElement.innerHTML = html;
    }

    // Highlight bir kez gösterildikten sonra listeden çıkar; sonraki alakasız
    // render'larda (örn. başka bir modun adı değiştiğinde) yeniden animasyon oynamasın
    newKeys.clear();
}

// Kategori bazında arama/filtre kutusu girişini işler
function filterModsList(category, term) {
    modSearchTerms[category] = term || '';
    updateModsList(category);
}

// Sekme başlığındaki mod sayısı rozetini günceller
function updateTabCount(category, count) {
    const badge = document.getElementById(`${category}TabCount`);
    if (!badge) return;
    badge.textContent = count;
    badge.classList.toggle('is-zero', count === 0);
}

// Kategori başına toplam mod sayısı/boyutunu günceller
function updateCategoryTotalSize(category, mods) {
    const el = document.getElementById(`${category}TotalSize`);
    if (!el) return;
    let totalMb = 0;
    mods.forEach(mod => {
        Object.values(mod.sizes || {}).forEach(sizeStr => {
            totalMb += parseFloat(sizeStr) || 0;
        });
    });
    el.innerHTML = `Toplam: <strong>${mods.size}</strong> mod, <strong>${totalMb.toFixed(2)} MB</strong>`;
}

// Tüm kategorilerin toplam mod sayısı/boyutunu günceller
function updateGrandTotal() {
    const bar = document.getElementById('grandTotalBar');
    if (!bar) return;
    let totalCount = 0;
    let totalMb = 0;
    ['vehicles', 'characters', 'objects', 'weapons'].forEach(category => {
        modData[category].forEach(mod => {
            totalCount++;
            Object.values(mod.sizes || {}).forEach(sizeStr => {
                totalMb += parseFloat(sizeStr) || 0;
            });
        });
    });
    bar.innerHTML = `📦 Toplam: <strong>${totalCount}</strong> mod, <strong>${totalMb.toFixed(2)} MB</strong>`;
}

// Yüklenen mod için silah ID'sini ayarla
function updateModWeapon(modId, weaponId) {
    if (!modData.weapons.has(modId)) return;
    
    const mod = modData.weapons.get(modId);
    
    if (!weaponId) {
        mod.weaponId = null;
        mod.weaponName = null;
        updateModsList('weapons');
        return;
    }
    
    // Seçilen silahın ID'si başka bir modda zaten kullanılıyorsa uyar
    if (weaponId !== modId && modData.weapons.has(weaponId)) {
        showToast(`"${weaponId}" ID'si zaten başka bir silah modu tarafından kullanılıyor! Lütfen önce o modu silin veya farklı bir silah seçin.`, 'warning');
        updateModsList('weapons');
        return;
    }
    
    mod.weaponId = weaponId;
    mod.weaponName = WEAPON_LIST[weaponId];
    mod.name = mod.weaponName;
    mod.id = weaponId;
    mod.needsId = false;
    
    // Mod haritasındaki anahtarı (ID) da güncelle ki üstteki ID kutusu
    // seçilen silahın 3 haneli ID'sini göstersin
    if (weaponId !== modId) {
        modData.weapons.delete(modId);
        modData.weapons.set(weaponId, mod);
    }
    
    updateModsList('weapons');
}

// Yüklenen modun ID'sini kullanıcı değiştirsin
function updateModId(category, oldId, newId) {
    newId = newId.trim();
    
    if (!/^\d+$/.test(newId)) {
        showToast('ID sadece rakamlardan oluşmalıdır!', 'warning');
        updateModsList(category);
        return;
    }
    
    if (newId === oldId) return;
    
    if (modData[category].has(newId)) {
        showToast(`"${newId}" ID'si zaten kullanılıyor! Lütfen farklı bir ID girin.`, 'warning');
        updateModsList(category);
        return;
    }
    
    const mod = modData[category].get(oldId);
    mod.id = newId;
    mod.needsId = false;
    modData[category].delete(oldId);
    modData[category].set(newId, mod);
    
    updateModsList(category);
}

// Mod adını güncelle
function updateModName(category, modId, newName) {
    if (modData[category].has(modId)) {
        modData[category].get(modId).name = newName || `Mod ${modId}`;
    }
}

// Modunu sil
async function deleteMod(category, modId) {
    const modName = modData[category].get(modId).name;
    const confirmed = await showConfirm(
        `"${modName}" modunu silmek istediğinize emin misiniz?`,
        { title: 'Modu Sil', icon: '🗑️' }
    );
    if (confirmed) {
        modData[category].delete(modId);
        updateModsList(category);
    }
}

// Kategorideki tüm modları seç / seçimi kaldır
function toggleSelectAll(category, checked) {
    document.querySelectorAll(`#${category}List .mod-item-checkbox`).forEach(cb => {
        cb.checked = checked;
    });
}

// Tekil checkbox değiştiğinde "Tümünü Seç" kutusunun durumunu güncelle
function updateSelectAllState(category) {
    const selectAllBox = document.getElementById(`${category}SelectAll`);
    if (!selectAllBox) return;
    
    const checkboxes = document.querySelectorAll(`#${category}List .mod-item-checkbox`);
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    selectAllBox.checked = allChecked;
}

// Seçili modlara sıralı ID ata (örn. 400, 401, 402...). Kategori içinde zaten
// kullanılan ID'leri atlar. Önerilen başlangıç değeri gerçek bir GTA:SA ID aralığı
// GARANTİSİ DEĞİLDİR — kullanıcı script oluşturmadan önce MTA Wiki'den doğrulamalı.
function bulkAssignIds(category) {
    const checkedBoxes = document.querySelectorAll(`#${category}List .mod-item-checkbox:checked`);

    if (checkedBoxes.length === 0) {
        showToast('Lütfen ID atamak istediğiniz modları işaretleyin!', 'warning');
        return;
    }

    bulkIdContext.category = category;
    bulkIdContext.modIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-mod-id'));

    const suggestedStart = BULK_ID_SUGGESTIONS[category] ?? 1;
    const wikiHints = {
        vehicles: 'Doğru aralık için MTA Wiki\'deki Vehicle IDs sayfasını kontrol edin.',
        characters: 'Doğru aralık için MTA Wiki\'deki Character Skins sayfasını kontrol edin.',
        objects: 'Doğru aralık için MTA Wiki\'deki Object IDs sayfasını kontrol edin.'
    };

    const summaryEl = document.getElementById('bulkIdSummary');
    const hintEl = document.getElementById('bulkIdHint');
    const inputEl = document.getElementById('bulkIdStartInput');
    if (summaryEl) summaryEl.textContent = `${bulkIdContext.modIds.length} moda sıralı ID atanacak.`;
    if (hintEl) hintEl.textContent = wikiHints[category] || 'Doğru aralık için MTA Wiki\'yi kontrol edin.';
    if (inputEl) inputEl.value = suggestedStart;

    const modal = document.getElementById('bulkIdModal');
    if (modal) modal.classList.add('active');
    if (inputEl) {
        inputEl.focus();
        inputEl.select();
        inputEl.onkeydown = function(e) {
            if (e.key === 'Enter') confirmBulkAssignIds();
        };
    }
}

// Toplu ID atama modalını kapat
function closeBulkIdModal() {
    const modal = document.getElementById('bulkIdModal');
    if (modal) modal.classList.remove('active');
    bulkIdContext = { category: null, modIds: [] };
}

// Modaldaki "Ata" butonuna basınca gerçek atamayı yapar
function confirmBulkAssignIds() {
    const { category, modIds } = bulkIdContext;
    if (!category || modIds.length === 0) {
        closeBulkIdModal();
        return;
    }

    const inputEl = document.getElementById('bulkIdStartInput');
    const startInput = inputEl ? inputEl.value.trim() : '';
    let candidate = parseInt(startInput, 10);

    if (isNaN(candidate) || candidate < 0) {
        showToast('Geçerli bir sayı girin!', 'warning');
        return;
    }

    const suggestedStart = candidate;

    // Bu kategoride, şu an atama yapılacak modlar HARİÇ kullanımda olan ID'ler
    const reserved = new Set();
    modData[category].forEach((mod, key) => {
        if (!modIds.includes(key)) reserved.add(String(mod.id));
    });

    let assignedCount = 0;
    modIds.forEach(oldKey => {
        const mod = modData[category].get(oldKey);
        if (!mod) return;

        while (reserved.has(String(candidate))) candidate++;

        const newKey = String(candidate);
        reserved.add(newKey);

        mod.id = newKey;
        mod.needsId = false;

        if (newKey !== oldKey) {
            modData[category].delete(oldKey);
            modData[category].set(newKey, mod);
        }

        assignedCount++;
        candidate++;
    });

    updateModsList(category);
    closeBulkIdModal();
    showToast(
        `${assignedCount} moda ${suggestedStart}'den başlayan sıralı ID atandı. Script oluşturmadan önce bu ID'lerin gerçek GTA:SA model ID'leriyle eşleştiğini MTA Wiki'den doğrulayın.`,
        'info'
    );
}

// Seçili modları toplu sil
async function deleteSelectedMods(category) {
    const checkedBoxes = document.querySelectorAll(`#${category}List .mod-item-checkbox:checked`);
    
    if (checkedBoxes.length === 0) {
        showToast('Lütfen silmek istediğiniz modları işaretleyin!', 'warning');
        return;
    }
    
    const modIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-mod-id'));
    
    const confirmed = await showConfirm(
        `${modIds.length} modu silmek istediğinize emin misiniz?`,
        { title: 'Seçilenleri Sil', icon: '🗑️' }
    );
    if (confirmed) {
        modIds.forEach(modId => modData[category].delete(modId));
        updateModsList(category);
    }
}

// Tüm modları temizle
async function clearAllMods() {
    const confirmed = await showConfirm(
        'Tüm modları silmek istediğinize emin misiniz?',
        { title: 'Tüm Modları Sil', icon: '🗑️' }
    );
    if (confirmed) {
        modData.vehicles.clear();
        modData.characters.clear();
        modData.objects.clear();
        modData.weapons.clear();

        pendingModData.vehicles.clear();
        pendingModData.characters.clear();
        pendingModData.objects.clear();
        pendingModData.weapons.clear();
        
        updateModsList('vehicles');
        updateModsList('characters');
        updateModsList('objects');
        updateModsList('weapons');
    }
}

// Script oluştur
function generateScript() {
    const hasAnyMods = 
        modData.vehicles.size > 0 || 
        modData.characters.size > 0 || 
        modData.objects.size > 0 || 
        modData.weapons.size > 0;
    
    if (!hasAnyMods) {
        showToast('Lütfen en az bir mod ekleyin!', 'warning');
        return;
    }
    
    const categoryLabels = { vehicles: 'Araç', characters: 'Karakter', objects: 'Obje', weapons: 'Silah' };
    const missingIdMods = [];
    ['vehicles', 'characters', 'objects', 'weapons'].forEach(category => {
        modData[category].forEach(mod => {
            if (mod.needsId) {
                missingIdMods.push(`${categoryLabels[category]}: ${mod.name}`);
            }
        });
    });
    
    if (missingIdMods.length > 0) {
        showToast(`Şu modların dosya adında ID numarası yok, lütfen "Yüklenen Modlar" listesinden ID girin:\n${missingIdMods.join('\n')}`, 'warning');
        return;
    }
    
    const unassignedWeapons = Array.from(modData.weapons.values()).filter(mod => !mod.weaponId);
    if (unassignedWeapons.length > 0) {
        showToast(`${unassignedWeapons.length} silah modu için henüz silah seçilmedi. Lütfen "Yüklenen Modlar" listesinden her mod için bir silah seçin.`, 'warning');
        return;
    }

    const idConflicts = findIdConflicts();
    if (idConflicts.length > 0) {
        const conflictLines = idConflicts.map(c => {
            const owners = c.owners.map(o => `${o.categoryLabel}: ${o.name}`).join('  ↔  ');
            return `ID ${c.id}  →  ${owners}`;
        }).join('\n');
        showToast(`ID Çakışması Tespit Edildi! Aşağıdaki ID'ler birden fazla mod tarafından kullanılıyor, bu durumda oyunda modeller birbirinin üzerine yazılır:\n${conflictLines}`, 'error');
        return;
    }
    
    const clientLua = generateClientLua();
    const metaXml = generateMetaXml();
    
    window.generatedClientLua = clientLua;
    window.generatedMetaXml = metaXml;
    
    showPreview(clientLua);
}

// Client.lua oluştur
function generateClientLua() {
    const primaryRgb = hexToRgb(loaderSettings.primaryColor);
    const bgRgb = hexToRgb(loaderSettings.bgColor);
    const textRgb = hexToRgb(loaderSettings.textColor);
    const musicBgRgb = hexToRgb(loaderSettings.musicBgColor);
    const musicAccentRgb = hexToRgb(loaderSettings.musicAccentColor);
    const musicTextRgb = hexToRgb(loaderSettings.musicTextColor);
    // Tam ekran mod loader sadece özel loader arayüzü ile birlikte anlamlıdır (native indirmede yok)
    const bgSlideEnabled = loaderSettings.fullscreenBgEnabled && !loaderSettings.nativeDownload && bgImages.length > 0;
    const bgImageEntries = bgSlideEnabled ? getBgImageEntries() : [];
    // Arka plan müzikleri, tam ekran mod loader açıkken ve en az bir mp3 seçilmişse etkin olur.
    const audioEnabled = loaderSettings.fullscreenBgEnabled && !loaderSettings.nativeDownload && bgAudioTracks.length > 0;
    const bgAudioEntries = audioEnabled ? getBgAudioEntries() : [];
    
    let lua = `-- ============================================\n`;
    lua += `-- MTA San Andreas Mod Loader\n`;
    lua += `-- Otomatik Olarak Oluşturuldu\n`;
    lua += `-- Loader Tarzı: ${loaderSettings.style}\n`;
    lua += `-- Ana Renk: ${loaderSettings.primaryColor}\n`;
    lua += `-- Arka Plan: ${loaderSettings.bgColor}\n`;
    lua += `-- Yazı Rengi: ${loaderSettings.textColor}\n`;
    lua += `-- ============================================\n`;
    lua += `--\n`;
    lua += `-- Bu Loader SparroWMTA Loader Oluşturma Sistemi İle Oluşturulmuştur.\n`;
    lua += `--\n`;
    lua += `-- Sitemiz : https://sparrow-mta.blogspot.com/\n`;
    lua += `-- Facebook : https://facebook.com/sparrowgta/\n`;
    lua += `-- İnstagram : https://instagram.com/sparrowmta/\n`;
    lua += `-- YouTube : https://www.youtube.com/@TurkishSparroW/\n`;
    lua += `-- Discord : https://discord.gg/DzgEcvy\n`;
    lua += `-- ============================================\n\n`;
    
    lua += `local modsToLoad = {}\n`;
    lua += `local currentMod = 0\n`;
    lua += `local totalMods = 0\n`;
    lua += `local isLoading = false\n`;
    lua += `local loadedSize = 0\n`;
    lua += `local totalSize = 0\n`;
    lua += `local currentModName = ""\n`;
    lua += `local currentModSize = 0\n`;
    lua += `local currentPercentage = 0\n\n`;
    
    lua += `-- Loader Tasarımı\n`;
    lua += `local loaderStyle = "${loaderSettings.style}"\n`;
    lua += `local loaderPosition = "${loaderSettings.position}"\n`;
    lua += `local barWidthPercent = ${loaderSettings.barWidth}\n`;
    lua += `local loaderFontSize = ${loaderSettings.fontSize}\n`;
    lua += `local primaryColorRGB = {r = ${primaryRgb.r}, g = ${primaryRgb.g}, b = ${primaryRgb.b}}\n`;
    lua += `local bgColorRGB = {r = ${bgRgb.r}, g = ${bgRgb.g}, b = ${bgRgb.b}}\n`;
    lua += `local textColorRGB = {r = ${textRgb.r}, g = ${textRgb.g}, b = ${textRgb.b}}\n`;
    lua += `local modSwitchDelay = ${Math.max(50, Math.round(loaderSettings.modDelay * 1000))} -- ms cinsinden, bir mod indikten sonra diğerine geçiş süresi\n`;
    lua += `local panelOpacity = ${Math.max(0, Math.min(255, Math.round(loaderSettings.bgOpacity / 100 * 255)))} -- panel/arkaplan zemininin alfa (saydamlık) değeri\n`;
    lua += `local smoothAnimationEnabled = ${loaderSettings.smoothAnimation ? 'true' : 'false'}\n`;
    lua += `local shadowEffectEnabled = ${loaderSettings.shadowEffect ? 'true' : 'false'}\n`;
    lua += `local smoothedPercentage = 0 -- yumuşak animasyon açıkken yüzde bu değere doğru kayarak ilerler\n\n`;
    
    // Araçlar
    if (modData.vehicles.size > 0) {
        lua += `-- ============================================\n`;
        lua += `-- ARAÇ MODLARI\n`;
        lua += `-- ============================================\n`;
        modData.vehicles.forEach((mod) => {
            const totalSize = (parseFloat(mod.sizes.dff || 0) + parseFloat(mod.sizes.txd || 0)).toFixed(2);
            lua += `table.insert(modsToLoad, {\n`;
            lua += `    id = ${mod.id},\n`;
            lua += `    type = "vehicle",\n`;
            lua += `    name = "${mod.name}",\n`;
            lua += `    dffFile = "Mods/Araba/${mod.id}.dff",\n`;
            lua += `    txdFile = "Mods/Araba/${mod.id}.txd",\n`;
            lua += `    size = ${totalSize}\n`;
            lua += `})\n`;
        });
        lua += `\n`;
    }
    
    // Karakterler
    if (modData.characters.size > 0) {
        lua += `-- ============================================\n`;
        lua += `-- KARAKTER MODLARI\n`;
        lua += `-- ============================================\n`;
        modData.characters.forEach((mod) => {
            const totalSize = (parseFloat(mod.sizes.dff || 0) + parseFloat(mod.sizes.txd || 0)).toFixed(2);
            lua += `table.insert(modsToLoad, {\n`;
            lua += `    id = ${mod.id},\n`;
            lua += `    type = "character",\n`;
            lua += `    name = "${mod.name}",\n`;
            lua += `    dffFile = "Mods/Karakter/${mod.id}.dff",\n`;
            lua += `    txdFile = "Mods/Karakter/${mod.id}.txd",\n`;
            lua += `    size = ${totalSize}\n`;
            lua += `})\n`;
        });
        lua += `\n`;
    }
    
    // Objeler
    if (modData.objects.size > 0) {
        lua += `-- ============================================\n`;
        lua += `-- OBJE MODLARI\n`;
        lua += `-- ============================================\n`;
        modData.objects.forEach((mod) => {
            const dffSize = parseFloat(mod.sizes.dff || 0);
            const txdSize = parseFloat(mod.sizes.txd || 0);
            const colSize = parseFloat(mod.sizes.col || 0);
            const totalSize = (dffSize + txdSize + colSize).toFixed(2);
            lua += `table.insert(modsToLoad, {\n`;
            lua += `    id = ${mod.id},\n`;
            lua += `    type = "object",\n`;
            lua += `    name = "${mod.name}",\n`;
            lua += `    dffFile = "Mods/Obje/${mod.id}.dff",\n`;
            lua += `    txdFile = "Mods/Obje/${mod.id}.txd",\n`;
            if (mod.files.col) {
                lua += `    colFile = "Mods/Obje/${mod.id}.col",\n`;
            }
            lua += `    size = ${totalSize}\n`;
            lua += `})\n`;
        });
        lua += `\n`;
    }
    
    // Silahlar
    if (modData.weapons.size > 0) {
        lua += `-- ============================================\n`;
        lua += `-- SİLAH MODLARI\n`;
        lua += `-- ============================================\n`;
        modData.weapons.forEach((mod) => {
            const effectiveId = mod.weaponId || mod.id;
            const totalSize = (parseFloat(mod.sizes.dff || 0) + parseFloat(mod.sizes.txd || 0)).toFixed(2);
            lua += `table.insert(modsToLoad, {\n`;
            lua += `    id = ${effectiveId},\n`;
            lua += `    type = "weapon",\n`;
            lua += `    name = "${mod.name}",\n`;
            lua += `    dffFile = "Mods/Silah/${effectiveId}.dff",\n`;
            lua += `    txdFile = "Mods/Silah/${effectiveId}.txd",\n`;
            lua += `    size = ${totalSize}\n`;
            lua += `})\n`;
        });
        lua += `\n`;
    }
    
    if (loaderSettings.nativeDownload) {
        lua += generateNativeDownloadLua();
        if (loaderSettings.modToggleEnabled) {
            lua += generateModToggleLua();
        }
        return lua;
    }

    // Yükleme sistemi
    lua += `-- ============================================\n`;
    lua += `-- YÜKLEME SİSTEMİ\n`;
    lua += `-- ============================================\n\n`;
    
    lua += `local pendingDownloads = {}\n\n`;
    
    lua += `function loadMods()\n`;
    lua += `    totalMods = #modsToLoad\n`;
    lua += `    currentMod = 0\n`;
    lua += `    isLoading = true\n`;
    lua += `    smoothedPercentage = 0\n`;
    if (loaderSettings.hideHudDuringLoading) {
        lua += `    showChat(false)\n`;
        lua += `    showPlayerHudComponent("all", false)\n`;
    }
    if (audioEnabled) {
        lua += `    startBgMusic()\n`;
    }
    lua += `    loadedSize = 0\n`;
    lua += `    totalSize = 0\n`;
    lua += `    \n`;
    lua += `    for i, mod in ipairs(modsToLoad) do\n`;
    lua += `        totalSize = totalSize + mod.size\n`;
    lua += `    end\n`;
    lua += `    \n`;
    lua += `    outputDebugString("[Mod Loader] Modlar indirilmeye başlandı...", 3, 0, 255, 0)\n`;
    lua += `    loadNextMod()\n`;
    lua += `end\n\n`;
    
    lua += `-- Bir sonraki modun dosyalarını indirme kuyruğuna alır\n`;
    lua += `function loadNextMod()\n`;
    lua += `    if currentMod < totalMods then\n`;
    lua += `        currentMod = currentMod + 1\n`;
    lua += `        local mod = modsToLoad[currentMod]\n`;
    lua += `        \n`;
    lua += `        loadedSize = loadedSize + mod.size\n`;
    lua += `        currentModName = mod.name\n`;
    lua += `        currentModSize = mod.size\n`;
    lua += `        currentPercentage = math.floor((loadedSize / totalSize) * 100)\n`;
    lua += `        \n`;
    lua += `        outputDebugString("[" .. currentMod .. "/" .. totalMods .. "] İndiriliyor: " .. mod.name .. " (" .. string.format("%.2f", mod.size) .. " MB) - %" .. currentPercentage, 3, 0, 200, 255)\n`;
    lua += `        \n`;
    lua += `        pendingDownloads = {}\n`;
    lua += `        table.insert(pendingDownloads, {file = mod.txdFile, kind = "txd", mod = mod})\n`;
    lua += `        table.insert(pendingDownloads, {file = mod.dffFile, kind = "dff", mod = mod})\n`;
    lua += `        if mod.colFile then\n`;
    lua += `            table.insert(pendingDownloads, {file = mod.colFile, kind = "col", mod = mod})\n`;
    lua += `        end\n`;
    lua += `        \n`;
    lua += `        downloadModFiles()\n`;
    lua += `    else\n`;
    lua += `        isLoading = false\n`;
    if (audioEnabled) {
        lua += `        stopBgMusic()\n`;
    }
    if (loaderSettings.hideHudDuringLoading) {
        lua += `        showChat(true)\n`;
        lua += `        showPlayerHudComponent("all", true)\n`;
    }
    lua += `        outputDebugString("[Mod Loader] ✓ Tüm modlar başarıyla indirildi ve yüklendi!", 3, 0, 255, 0)\n`;
    lua += `    end\n`;
    lua += `end\n\n`;
    
    lua += `-- Kuyruktaki bir sonraki dosyayı indirir.\n`;
    lua += `-- NOT: Dosya oyuncunun diskinde önceden (önceki bir oturumdan) mevcut olsa\n`;
    lua += `-- bile downloadFile() HER ZAMAN çağrılır. fileExists() true dönse dahi MTA bu\n`;
    lua += `-- dosyayı bu resource oturumu için henüz "indirildi" olarak işaretlememiş\n`;
    lua += `-- olabilir; dosya doğrudan engineLoadDFF/TXD ile açılmaya çalışılırsa\n`;
    lua += `-- "Attempt to load ... before onClientFileDownloadComplete event" uyarısı\n`;
    lua += `-- oluşur. downloadFile() çağrıldığında dosya zaten güncelse gerçek bir ağ\n`;
    lua += `-- indirmesi yapılmaz ve onClientFileDownloadComplete olayı anında (aynı\n`;
    lua += `-- tick'te) tetiklenir; yani performans kaybı olmadan uyarı da önlenmiş olur.\n`;
    lua += `function downloadModFiles()\n`;
    lua += `    if #pendingDownloads > 0 then\n`;
    lua += `        local entry = pendingDownloads[1]\n`;
    lua += `        downloadFile(entry.file)\n`;
    lua += `    else\n`;
    lua += `        setTimer(loadNextMod, modSwitchDelay, 1)\n`;
    lua += `    end\n`;
    lua += `end\n\n`;
    
    lua += `-- İndirilen dosyayı türüne göre modele uygular\n`;
    lua += `function applyDownloadedFile(entry)\n`;
    lua += `    local mod = entry.mod\n`;
    lua += `    if entry.kind == "txd" then\n`;
    lua += `        local txd = engineLoadTXD(entry.file)\n`;
    lua += `        if txd then\n`;
    lua += `            engineImportTXD(txd, tonumber(mod.id))\n`;
    lua += `        else\n`;
    lua += `            outputDebugString("[HATA] TXD yüklenemedi: " .. entry.file, 3, 255, 0, 0)\n`;
    lua += `        end\n`;
    lua += `    elseif entry.kind == "dff" then\n`;
    lua += `        local dff = engineLoadDFF(entry.file)\n`;
    lua += `        if dff then\n`;
    lua += `            engineReplaceModel(dff, tonumber(mod.id))\n`;
    lua += `        else\n`;
    lua += `            outputDebugString("[HATA] DFF yüklenemedi: " .. entry.file, 3, 255, 0, 0)\n`;
    lua += `        end\n`;
    lua += `    elseif entry.kind == "col" then\n`;
    lua += `        local col = engineLoadCOL(entry.file)\n`;
    lua += `        if col then\n`;
    lua += `            engineReplaceCOL(col, tonumber(mod.id))\n`;
    lua += `        else\n`;
    lua += `            outputDebugString("[HATA] COL yüklenemedi: " .. entry.file, 3, 255, 0, 0)\n`;
    lua += `        end\n`;
    lua += `    end\n`;
    lua += `end\n\n`;
    
    lua += `-- meta.xml'de download="false" olduğu için dosyalar burada manuel indiriliyor\n`;
    lua += `addEventHandler("onClientFileDownloadComplete", root, function(name, success)\n`;
    lua += `    if source == resourceRoot then\n`;
    lua += `        if #pendingDownloads > 0 and pendingDownloads[1].file == name then\n`;
    lua += `            if success then\n`;
    lua += `                applyDownloadedFile(pendingDownloads[1])\n`;
    lua += `            else\n`;
    lua += `                outputDebugString("[HATA] Dosya indirilemedi: " .. name, 3, 255, 0, 0)\n`;
    lua += `            end\n`;
    lua += `            table.remove(pendingDownloads, 1)\n`;
    lua += `            downloadModFiles()\n`;
    lua += `        end\n`;
    lua += `    end\n`;
    lua += `end)\n\n`;
    
    lua += `-- Oyuncu sunucuya katıldığında modları indirmeye başla\n`;
    lua += `addEventHandler("onClientResourceStart", resourceRoot, function()\n`;
    lua += `    loadMods()\n`;
    lua += `end)\n\n`;

    if (loaderSettings.hideHudDuringLoading) {
        lua += `-- Yükleme tamamlanmadan resource durursa chat/HUD gizli kalmasın diye güvenlik önlemi\n`;
        lua += `addEventHandler("onClientResourceStop", resourceRoot, function()\n`;
        lua += `    if isLoading then\n`;
        lua += `        showChat(true)\n`;
        lua += `        showPlayerHudComponent("all", true)\n`;
        lua += `    end\n`;
        lua += `end)\n\n`;
    }
    
    // Progress bar (dxDraw) sistemi
    lua += `-- ============================================\n`;
    lua += `-- YÜKLEME EKRANI (PROGRESS BAR)\n`;
    lua += `-- ============================================\n\n`;
    
    lua += `local screenW, screenH = guiGetScreenSize()\n\n`;

    if (bgSlideEnabled) {
        lua += `-- ============================================\n`;
        lua += `-- TAM EKRAN ARKAPLAN SLAYTI\n`;
        lua += `-- ============================================\n\n`;

        lua += `local bgImagePaths = {\n`;
        bgImageEntries.forEach((entry) => {
            lua += `    "${entry.path}",\n`;
        });
        lua += `}\n`;
        lua += `local bgSlideInterval = ${Math.max(1000, Math.round(loaderSettings.bgSlideInterval * 1000))} -- ms cinsinden görseller arası geçiş süresi\n`;
        lua += `local bgTextures = {}\n`;
        lua += `local bgCurrentIndex = 1\n\n`;

        lua += `-- Arkaplan görselleri meta.xml'de download="true" ile paketlenir, yani resource\n`;
        lua += `-- başlamadan önce oyuncuda hazır olurlar; bu yüzden mod dosyaları gibi manuel\n`;
        lua += `-- indirme kuyruğu/onClientFileDownloadComplete beklemesine gerek yoktur.\n`;
        lua += `local function loadBgTextures()\n`;
        lua += `    for i, path in ipairs(bgImagePaths) do\n`;
        lua += `        local tex = dxCreateTexture(path)\n`;
        lua += `        if tex then\n`;
        lua += `            table.insert(bgTextures, tex)\n`;
        lua += `        else\n`;
        lua += `            outputDebugString("[HATA] Arkaplan görseli yüklenemedi: " .. path, 3, 255, 0, 0)\n`;
        lua += `        end\n`;
        lua += `    end\n`;
        lua += `    if #bgTextures > 1 then\n`;
        lua += `        setTimer(function()\n`;
        lua += `            bgCurrentIndex = (bgCurrentIndex % #bgTextures) + 1\n`;
        lua += `        end, bgSlideInterval, 0)\n`;
        lua += `    end\n`;
        lua += `end\n`;
        lua += `addEventHandler("onClientResourceStart", resourceRoot, function()\n`;
        lua += `    loadBgTextures()\n`;
        lua += `end)\n\n`;

        lua += `-- Görseli oranını bozmadan ekranı uçtan uca kaplayacak şekilde (cover/crop)\n`;
        lua += `-- çizer; böylece 1920x1080 dışındaki her ekran çözünürlüğünde de boşluk kalmaz.\n`;
        lua += `local function drawBgSlideshow()\n`;
        lua += `    local tex = bgTextures[bgCurrentIndex]\n`;
        lua += `    if not tex then return end\n`;
        lua += `    local texW, texH = dxGetMaterialSize(tex)\n`;
        lua += `    if not texW or texW == 0 or not texH or texH == 0 then return end\n`;
        lua += `    local scale = math.max(screenW / texW, screenH / texH)\n`;
        lua += `    local drawW, drawH = texW * scale, texH * scale\n`;
        lua += `    local drawX, drawY = (screenW - drawW) / 2, (screenH - drawH) / 2\n`;
        lua += `    dxDrawImage(drawX, drawY, drawW, drawH, tex)\n`;
        lua += `end\n\n`;
    }

    if (audioEnabled) {
        lua += `-- ============================================\n`;
        lua += `-- ARKA PLAN MÜZİKLERİ (birden fazla MP3 + geçiş paneli)\n`;
        lua += `-- ============================================\n\n`;

        lua += `local bgMusicPaths = {\n`;
        bgAudioEntries.forEach((entry) => {
            lua += `    "${entry.path}",\n`;
        });
        lua += `}\n`;
        lua += `local bgMusicTrackNames = {\n`;
        bgAudioTracks.forEach((track) => {
            const safeName = (track.name || track.file.name).replace(/"/g, "'");
            lua += `    "${safeName}",\n`;
        });
        lua += `}\n`;
        lua += `local bgMusicSound = nil\n`;
        lua += `local bgMusicIndex = 1\n`;
        lua += `local bgMusicVolume = ${Math.max(0, Math.min(1, loaderSettings.bgAudioVolume / 100)).toFixed(2)}\n`;
        lua += `local bgMusicMuted = false\n`;
        lua += `local musicPanelVisible = false -- panel artık GUI değil, DX ile çizilir\n\n`;

        lua += `-- Müzik Paneli Tasarımı (Loader Tasarımı'ndan bağımsız, ayrı ayarlanır)\n`;
        lua += `local musicPanelPosition = "${loaderSettings.musicPanelPosition}"\n`;
        lua += `local musicBgColorRGB = {r = ${musicBgRgb.r}, g = ${musicBgRgb.g}, b = ${musicBgRgb.b}}\n`;
        lua += `local musicAccentColorRGB = {r = ${musicAccentRgb.r}, g = ${musicAccentRgb.g}, b = ${musicAccentRgb.b}}\n`;
        lua += `local musicTextColorRGB = {r = ${musicTextRgb.r}, g = ${musicTextRgb.g}, b = ${musicTextRgb.b}}\n`;
        lua += `local musicPanelAlpha = ${Math.max(0, Math.min(255, Math.round(loaderSettings.musicOpacity / 100 * 255)))} -- müzik paneli zemininin alfa (saydamlık) değeri\n`;
        lua += `local musicShadowEffectEnabled = ${loaderSettings.musicShadowEffect ? 'true' : 'false'}\n\n`;

        lua += `-- Müzik dosyaları meta.xml'de download="true" ile paketlenir, yani resource\n`;
        lua += `-- başlamadan önce oyuncuda hazır olurlar; yükleme başladığında çalınmaya\n`;
        lua += `-- başlar, yükleme bittiğinde durdurulur ve panel/imleç de kapanır.\n`;
        lua += `local function mtApplyMusicVolume()\n`;
        lua += `    if bgMusicSound and isElement(bgMusicSound) then\n`;
        lua += `        setSoundVolume(bgMusicSound, bgMusicMuted and 0 or bgMusicVolume)\n`;
        lua += `    end\n`;
        lua += `end\n\n`;

        lua += `function mtPlayCurrentTrack()\n`;
        lua += `    if bgMusicSound and isElement(bgMusicSound) then\n`;
        lua += `        stopSound(bgMusicSound)\n`;
        lua += `        bgMusicSound = nil\n`;
        lua += `    end\n`;
        lua += `    local path = bgMusicPaths[bgMusicIndex]\n`;
        lua += `    if not path then return end\n`;
        lua += `    bgMusicSound = playSound(path, true)\n`;
        lua += `    if bgMusicSound then\n`;
        lua += `        mtApplyMusicVolume()\n`;
        lua += `    else\n`;
        lua += `        outputDebugString("[HATA] Arka plan müziği yüklenemedi: " .. path, 3, 255, 0, 0)\n`;
        lua += `    end\n`;
        lua += `end\n\n`;

        lua += `-- Panelde << / >> butonlarıyla müzikler arasında geçiş yapılır\n`;
        lua += `function mtNextMusicTrack()\n`;
        lua += `    if #bgMusicPaths == 0 then return end\n`;
        lua += `    bgMusicIndex = (bgMusicIndex % #bgMusicPaths) + 1\n`;
        lua += `    mtPlayCurrentTrack()\n`;
        lua += `end\n\n`;

        lua += `function mtPrevMusicTrack()\n`;
        lua += `    if #bgMusicPaths == 0 then return end\n`;
        lua += `    bgMusicIndex = bgMusicIndex - 1\n`;
        lua += `    if bgMusicIndex < 1 then bgMusicIndex = #bgMusicPaths end\n`;
        lua += `    mtPlayCurrentTrack()\n`;
        lua += `end\n\n`;

        lua += `function mtToggleMusicMute()\n`;
        lua += `    bgMusicMuted = not bgMusicMuted\n`;
        lua += `    mtApplyMusicVolume()\n`;
        lua += `end\n\n`;

        lua += `-- Yükleme panelinin (ilerleme çubuğunun) o an ekranda kapladığı toplam\n`;
        lua += `-- yüksekliği, seçilen stile göre hesaplar; müzik panelini buna göre\n`;
        lua += `-- tam olarak bir satır üstüne, ortalı şekilde konumlandırmak için kullanılır.\n`;
        lua += `local function getLoaderPanelHeight()\n`;
        lua += `    if loaderStyle == "frame" then\n`;
        lua += `        return (loaderFontSize + 10) + 16\n`;
        lua += `    elseif loaderStyle == "segmented" then\n`;
        lua += `        return (loaderFontSize + 10) + 18\n`;
        lua += `    elseif loaderStyle == "sideLabel" then\n`;
        lua += `        return (loaderFontSize + 14) + 8 + 10\n`;
        lua += `    else\n`;
        lua += `        local padding = 18\n`;
        lua += `        local barHeight = 10\n`;
        lua += `        local nameRowHeight = loaderFontSize + 6\n`;
        lua += `        local sizeRowHeight = math.floor(loaderFontSize * 0.75) + 6\n`;
        lua += `        local gapA, gapB = 10, 8\n`;
        lua += `        return padding * 2 + nameRowHeight + gapA + barHeight + gapB + sizeRowHeight\n`;
        lua += `    end\n`;
        lua += `end\n\n`;

        lua += `-- Müzik panelinin DX koordinatlarını döndürür. "musicPanelPosition" ayarına göre\n`;
        lua += `-- ya yükleme panelinin (konumu top/center/bottom fark etmeksizin) bir satır\n`;
        lua += `-- üstünde ortalanır, ya da ekranın seçilen sabit köşesinde durur.\n`;
        lua += `local function getMusicPanelGeometry()\n`;
        lua += `    local panelW, panelH = 320, 120\n`;
        lua += `    local edgeMargin = 24\n`;
        lua += `    if musicPanelPosition == "topRight" then\n`;
        lua += `        return screenW - panelW - edgeMargin, screenH * 0.06, panelW, panelH\n`;
        lua += `    elseif musicPanelPosition == "topLeft" then\n`;
        lua += `        return edgeMargin, screenH * 0.06, panelW, panelH\n`;
        lua += `    elseif musicPanelPosition == "bottomRight" then\n`;
        lua += `        return screenW - panelW - edgeMargin, screenH - panelH - (screenH * 0.06), panelW, panelH\n`;
        lua += `    elseif musicPanelPosition == "bottomLeft" then\n`;
        lua += `        return edgeMargin, screenH - panelH - (screenH * 0.06), panelW, panelH\n`;
        lua += `    end\n`;
        lua += `    -- Varsayılan: "aboveLoader" (yükleme panelinin bir satır üstü, ortalı)\n`;
        lua += `    local loaderHeight = getLoaderPanelHeight()\n`;
        lua += `    local loaderTopY\n`;
        lua += `    if loaderPosition == "top" then\n`;
        lua += `        loaderTopY = screenH * 0.08\n`;
        lua += `    elseif loaderPosition == "center" then\n`;
        lua += `        loaderTopY = (screenH / 2) - (loaderHeight / 2)\n`;
        lua += `    else\n`;
        lua += `        loaderTopY = screenH - (screenH * 0.14)\n`;
        lua += `    end\n`;
        lua += `    local lineGap = loaderFontSize + 16 -- yükleme panelinin bir satır üstü\n`;
        lua += `    local px = (screenW - panelW) / 2\n`;
        lua += `    local py = loaderTopY - lineGap - panelH\n`;
        lua += `    return px, py, panelW, panelH\n`;
        lua += `end\n\n`;

        lua += `-- Müzik kontrol panelini DX ile çizer (GUI kullanılmaz): parça adı,\n`;
        lua += `-- önceki/sonraki butonları, sessiz aç/kapat ve ses seviyesi çubuğu.\n`;
        lua += `local function drawMusicPanel()\n`;
        lua += `    if not musicPanelVisible then return end\n`;
        lua += `    if not bgMusicPaths or #bgMusicPaths == 0 then return end\n`;
        lua += `    local px, py, panelW, panelH = getMusicPanelGeometry()\n`;
        lua += `    \n`;
        lua += `    if musicShadowEffectEnabled then\n`;
        lua += `        dxDrawRectangle(px + 4, py + 4, panelW, panelH, tocolor(0, 0, 0, 90))\n`;
        lua += `    end\n`;
        lua += `    dxDrawRectangle(px, py, panelW, panelH, tocolor(musicBgColorRGB.r, musicBgColorRGB.g, musicBgColorRGB.b, musicPanelAlpha))\n`;
        lua += `    dxDrawRectangle(px, py, panelW, 26, tocolor(musicAccentColorRGB.r, musicAccentColorRGB.g, musicAccentColorRGB.b, 235))\n`;
        lua += `    dxDrawText("Yukleme Muzigi", px, py, px + panelW, py + 26, tocolor(255, 255, 255, 255), 0.85, "default-bold", "center", "center")\n`;
        lua += `    \n`;
        lua += `    local trackName = bgMusicTrackNames[bgMusicIndex] or "?"\n`;
        lua += `    dxDrawText(bgMusicIndex .. "/" .. #bgMusicPaths .. "  -  " .. trackName, px + 10, py + 30, px + panelW - 10, py + 52, tocolor(musicTextColorRGB.r, musicTextColorRGB.g, musicTextColorRGB.b, 255), 0.78, "default-bold", "center", "center")\n`;
        lua += `    \n`;
        lua += `    local btnY = py + 58\n`;
        lua += `    local btnH = 26\n`;
        lua += `    local prevW, nextW = 55, 55\n`;
        lua += `    local prevX = px + 10\n`;
        lua += `    local nextX = px + panelW - 10 - nextW\n`;
        lua += `    local muteX = prevX + prevW + 5\n`;
        lua += `    local muteW = nextX - muteX - 5\n`;
        lua += `    \n`;
        lua += `    dxDrawRectangle(prevX, btnY, prevW, btnH, tocolor(musicTextColorRGB.r, musicTextColorRGB.g, musicTextColorRGB.b, 30))\n`;
        lua += `    dxDrawText("<<", prevX, btnY, prevX + prevW, btnY + btnH, tocolor(musicTextColorRGB.r, musicTextColorRGB.g, musicTextColorRGB.b, 255), 1, "default-bold", "center", "center")\n`;
        lua += `    \n`;
        lua += `    dxDrawRectangle(muteX, btnY, muteW, btnH, tocolor(musicTextColorRGB.r, musicTextColorRGB.g, musicTextColorRGB.b, 30))\n`;
        lua += `    dxDrawText(bgMusicMuted and "Ses Kapali" or "Ses Acik", muteX, btnY, muteX + muteW, btnY + btnH, tocolor(musicTextColorRGB.r, musicTextColorRGB.g, musicTextColorRGB.b, 255), 0.78, "default-bold", "center", "center")\n`;
        lua += `    \n`;
        lua += `    dxDrawRectangle(nextX, btnY, nextW, btnH, tocolor(musicTextColorRGB.r, musicTextColorRGB.g, musicTextColorRGB.b, 30))\n`;
        lua += `    dxDrawText(">>", nextX, btnY, nextX + nextW, btnY + btnH, tocolor(musicTextColorRGB.r, musicTextColorRGB.g, musicTextColorRGB.b, 255), 1, "default-bold", "center", "center")\n`;
        lua += `    \n`;
        lua += `    local volY = btnY + btnH + 16\n`;
        lua += `    local volX = px + 10\n`;
        lua += `    local volW = panelW - 20\n`;
        lua += `    dxDrawText("Ses Seviyesi", volX, volY - 16, volX + volW, volY, tocolor(musicTextColorRGB.r, musicTextColorRGB.g, musicTextColorRGB.b, 220), 0.68, "default-bold", "left", "bottom")\n`;
        lua += `    dxDrawRectangle(volX, volY, volW, 10, tocolor(0, 0, 0, 120))\n`;
        lua += `    dxDrawRectangle(volX, volY, math.max(volW * (bgMusicMuted and 0 or bgMusicVolume), 2), 10, tocolor(musicAccentColorRGB.r, musicAccentColorRGB.g, musicAccentColorRGB.b, 255))\n`;
        lua += `end\n\n`;

        lua += `-- Müzik paneli artık DX ile çizildiği için tıklamalar onClientClick\n`;
        lua += `-- üzerinden buton/ses çubuğu koordinatlarıyla karşılaştırılarak yakalanır.\n`;
        lua += `addEventHandler("onClientClick", root, function(button, state, cx, cy)\n`;
        lua += `    if button ~= "left" or state ~= "up" then return end\n`;
        lua += `    if not musicPanelVisible then return end\n`;
        lua += `    if not bgMusicPaths or #bgMusicPaths == 0 then return end\n`;
        lua += `    local px, py, panelW, panelH = getMusicPanelGeometry()\n`;
        lua += `    local btnY = py + 58\n`;
        lua += `    local btnH = 26\n`;
        lua += `    local prevW, nextW = 55, 55\n`;
        lua += `    local prevX = px + 10\n`;
        lua += `    local nextX = px + panelW - 10 - nextW\n`;
        lua += `    local muteX = prevX + prevW + 5\n`;
        lua += `    local muteW = nextX - muteX - 5\n`;
        lua += `    \n`;
        lua += `    if cy >= btnY and cy <= btnY + btnH then\n`;
        lua += `        if cx >= prevX and cx <= prevX + prevW then\n`;
        lua += `            mtPrevMusicTrack()\n`;
        lua += `            return\n`;
        lua += `        elseif cx >= muteX and cx <= muteX + muteW then\n`;
        lua += `            mtToggleMusicMute()\n`;
        lua += `            return\n`;
        lua += `        elseif cx >= nextX and cx <= nextX + nextW then\n`;
        lua += `            mtNextMusicTrack()\n`;
        lua += `            return\n`;
        lua += `        end\n`;
        lua += `    end\n`;
        lua += `    \n`;
        lua += `    local volY = btnY + btnH + 16\n`;
        lua += `    local volX = px + 10\n`;
        lua += `    local volW = panelW - 20\n`;
        lua += `    if cy >= volY - 6 and cy <= volY + 16 and cx >= volX and cx <= volX + volW then\n`;
        lua += `        local ratio = (cx - volX) / volW\n`;
        lua += `        bgMusicVolume = math.max(0, math.min(1, ratio))\n`;
        lua += `        mtApplyMusicVolume()\n`;
        lua += `    end\n`;
        lua += `end)\n\n`;

        lua += `function startBgMusic()\n`;
        lua += `    bgMusicIndex = 1\n`;
        lua += `    musicPanelVisible = true\n`;
        lua += `    showCursor(true)\n`;
        lua += `    mtPlayCurrentTrack()\n`;
        lua += `end\n\n`;

        lua += `function stopBgMusic()\n`;
        lua += `    if bgMusicSound and isElement(bgMusicSound) then\n`;
        lua += `        stopSound(bgMusicSound)\n`;
        lua += `    end\n`;
        lua += `    bgMusicSound = nil\n`;
        lua += `    musicPanelVisible = false\n`;
        lua += `    showCursor(false)\n`;
        lua += `end\n\n`;

        lua += `addEventHandler("onClientResourceStop", resourceRoot, function()\n`;
        lua += `    stopBgMusic()\n`;
        lua += `end)\n\n`;
    }

    lua += `local function getBarGeometry(barHeight)\n`;
    lua += `    local barWidth = screenW * (barWidthPercent / 100)\n`;
    lua += `    local barX = (screenW - barWidth) / 2\n`;
    lua += `    local barY\n`;
    lua += `    if loaderPosition == "top" then\n`;
    lua += `        barY = screenH * 0.08\n`;
    lua += `    elseif loaderPosition == "center" then\n`;
    lua += `        barY = (screenH / 2) - (barHeight / 2)\n`;
    lua += `    else\n`;
    lua += `        barY = screenH - (screenH * 0.14)\n`;
    lua += `    end\n`;
    lua += `    return barX, barY, barWidth, barHeight\n`;
    lua += `end\n\n`;
    
    lua += `local function drawLoaderUI()\n`;
    lua += `    local fontScale = loaderFontSize / 9\n`;
    lua += `    local percentage = math.floor(smoothedPercentage + 0.5)\n`;
    lua += `    local modName = currentModName ~= "" and currentModName or "Hazırlanıyor..."\n`;
    lua += `    local modSize = currentModSize\n`;
    lua += `    local bgColorA = tocolor(bgColorRGB.r, bgColorRGB.g, bgColorRGB.b, panelOpacity)\n`;
    lua += `    local shadowColorA = tocolor(0, 0, 0, math.floor(panelOpacity * 0.55))\n`;
    lua += `    local primaryColorA = tocolor(primaryColorRGB.r, primaryColorRGB.g, primaryColorRGB.b, 255)\n`;
    lua += `    local textColorA = tocolor(textColorRGB.r, textColorRGB.g, textColorRGB.b, 255)\n`;
    lua += `    local mutedColorA = tocolor(textColorRGB.r, textColorRGB.g, textColorRGB.b, 160)\n`;
    lua += `    local label = string.format("%s   -   %.2f MB   -   %%%d", modName, modSize, percentage)\n`;
    lua += `    \n`;
    lua += `    if loaderStyle == "frame" then\n`;
    lua += `        local labelHeight = loaderFontSize + 10\n`;
    lua += `        local barHeight = 16\n`;
    lua += `        local border = 2\n`;
    lua += `        local barX, barY, barWidth = getBarGeometry(labelHeight + barHeight)\n`;
    lua += `        \n`;
    lua += `        dxDrawText(label, barX, barY, barX + barWidth, barY + labelHeight, textColorA, fontScale, "default-bold", "center", "bottom")\n`;
    lua += `        \n`;
    lua += `        local innerBarY = barY + labelHeight\n`;
    lua += `        if shadowEffectEnabled then\n`;
    lua += `            dxDrawRectangle(barX + 3, innerBarY + 3, barWidth, barHeight, shadowColorA)\n`;
    lua += `        end\n`;
    lua += `        dxDrawRectangle(barX, innerBarY, barWidth, barHeight, primaryColorA)\n`;
    lua += `        dxDrawRectangle(barX + border, innerBarY + border, barWidth - border * 2, barHeight - border * 2, bgColorA)\n`;
    lua += `        dxDrawRectangle(barX + border, innerBarY + border, math.max((barWidth - border * 2) * (percentage / 100), 2), barHeight - border * 2, primaryColorA)\n`;
    lua += `        \n`;
    lua += `    elseif loaderStyle == "segmented" then\n`;
    lua += `        local labelHeight = loaderFontSize + 10\n`;
    lua += `        local barHeight = 18\n`;
    lua += `        local barX, barY, barWidth = getBarGeometry(labelHeight + barHeight)\n`;
    lua += `        \n`;
    lua += `        dxDrawText(label, barX, barY, barX + barWidth, barY + labelHeight, textColorA, fontScale, "default-bold", "center", "bottom")\n`;
    lua += `        \n`;
    lua += `        local innerBarY = barY + labelHeight\n`;
    lua += `        local segmentCount = 24\n`;
    lua += `        local gap = 3\n`;
    lua += `        local segmentWidth = (barWidth - gap * (segmentCount - 1)) / segmentCount\n`;
    lua += `        local filledSegments = math.floor(segmentCount * (percentage / 100) + 0.5)\n`;
    lua += `        for i = 0, segmentCount - 1 do\n`;
    lua += `            local segX = barX + i * (segmentWidth + gap)\n`;
    lua += `            local segColor = (i < filledSegments) and primaryColorA or bgColorA\n`;
    lua += `            dxDrawRectangle(segX, innerBarY, segmentWidth, barHeight, segColor)\n`;
    lua += `        end\n`;
    lua += `        \n`;
    lua += `    elseif loaderStyle == "sideLabel" then\n`;
    lua += `        local rowHeight = loaderFontSize + 14\n`;
    lua += `        local barHeight = 10\n`;
    lua += `        local gapA = 8\n`;
    lua += `        local barX, barY, barWidth = getBarGeometry(rowHeight + gapA + barHeight)\n`;
    lua += `        \n`;
    lua += `        local percentWidth = 70\n`;
    lua += `        dxDrawText("%" .. percentage, barX, barY, barX + percentWidth, barY + rowHeight, primaryColorA, fontScale * 1.6, "default-bold", "left", "center")\n`;
    lua += `        dxDrawText(modName, barX + percentWidth, barY, barX + barWidth, barY + rowHeight / 2, textColorA, fontScale * 0.9, "default-bold", "left", "bottom")\n`;
    lua += `        dxDrawText(string.format("%.2f MB", modSize), barX + percentWidth, barY + rowHeight / 2, barX + barWidth, barY + rowHeight, mutedColorA, fontScale * 0.65, "default-bold", "left", "top")\n`;
    lua += `        \n`;
    lua += `        local innerBarY = barY + rowHeight + gapA\n`;
    lua += `        dxDrawRectangle(barX, innerBarY, barWidth, barHeight, bgColorA)\n`;
    lua += `        dxDrawRectangle(barX, innerBarY, math.max(barWidth * (percentage / 100), 2), barHeight, primaryColorA)\n`;
    lua += `        \n`;
    lua += `    else\n`;
    lua += `        local padding = 18\n`;
    lua += `        local barHeight = 10\n`;
    lua += `        local nameRowHeight = loaderFontSize + 6\n`;
    lua += `        local sizeRowHeight = math.floor(loaderFontSize * 0.75) + 6\n`;
    lua += `        local gapA, gapB = 10, 8\n`;
    lua += `        local panelHeight = padding * 2 + nameRowHeight + gapA + barHeight + gapB + sizeRowHeight\n`;
    lua += `        local panelX, panelY, panelWidth = getBarGeometry(panelHeight)\n`;
    lua += `        \n`;
    lua += `        local innerX = panelX + padding\n`;
    lua += `        local innerWidth = panelWidth - padding * 2\n`;
    lua += `        \n`;
    lua += `        -- Panel arka planı (gölge açıksa altına hafif kaydırılmış koyu bir kopya çizilir)\n`;
    lua += `        if shadowEffectEnabled then\n`;
    lua += `            dxDrawRectangle(panelX + 5, panelY + 5, panelWidth, panelHeight, shadowColorA)\n`;
    lua += `        end\n`;
    lua += `        dxDrawRectangle(panelX, panelY, panelWidth, panelHeight, bgColorA)\n`;
    lua += `        \n`;
    lua += `        -- Mod adı (sol) ve yüzde (sağ)\n`;
    lua += `        local nameY = panelY + padding\n`;
    lua += `        dxDrawText(modName, innerX, nameY, innerX + innerWidth * 0.65, nameY + nameRowHeight, textColorA, fontScale, "default-bold", "left", "center")\n`;
    lua += `        dxDrawText("%" .. percentage, innerX, nameY, innerX + innerWidth, nameY + nameRowHeight, primaryColorA, fontScale * 1.05, "default-bold", "right", "center")\n`;
    lua += `        \n`;
    lua += `        -- İlerleme çubuğu\n`;
    lua += `        local barY = nameY + nameRowHeight + gapA\n`;
    lua += `        dxDrawRectangle(innerX, barY, innerWidth, barHeight, tocolor(0, 0, 0, 90))\n`;
    lua += `        dxDrawRectangle(innerX, barY, math.max(innerWidth * (percentage / 100), 2), barHeight, primaryColorA)\n`;
    lua += `        \n`;
    lua += `        -- Boyut bilgisi\n`;
    lua += `        local sizeY = barY + barHeight + gapB\n`;
    lua += `        dxDrawText(string.format("%.2f MB", modSize), innerX, sizeY, innerX + innerWidth, sizeY + sizeRowHeight, mutedColorA, fontScale * 0.78, "default-bold", "left", "center")\n`;
    lua += `    end\n`;
    lua += `end\n\n`;
    
    lua += `addEventHandler("onClientRender", root, function()\n`;
    lua += `    if isLoading then\n`;
    if (bgSlideEnabled) {
        lua += `        drawBgSlideshow()\n`;
    }
    lua += `        if smoothAnimationEnabled then\n`;
    lua += `            smoothedPercentage = smoothedPercentage + (currentPercentage - smoothedPercentage) * 0.15\n`;
    lua += `            if math.abs(currentPercentage - smoothedPercentage) < 0.2 then\n`;
    lua += `                smoothedPercentage = currentPercentage\n`;
    lua += `            end\n`;
    lua += `        else\n`;
    lua += `            smoothedPercentage = currentPercentage\n`;
    lua += `        end\n`;
    lua += `        drawLoaderUI()\n`;
    if (audioEnabled) {
        lua += `        drawMusicPanel()\n`;
    }
    lua += `    end\n`;
    lua += `end)\n`;

    if (loaderSettings.modToggleEnabled) {
        lua += generateModToggleLua();
    }
    
    return lua;
}

// MTA Native İndirme (download="true") modu için basitleştirilmiş uygulama kodu.
// Dosyalar meta.xml'de download="true" olduğundan resource başlamadan önce MTA
// tarafından zaten indirilmiştir; bu yüzden özel kuyruk/indirme/loading-bar
// mantığına gerek yoktur, modeller doğrudan uygulanır.
function generateNativeDownloadLua() {
    let lua = `-- ============================================\n`;
    lua += `-- MODELLERİ UYGULA (MTA NATIVE İNDİRME)\n`;
    lua += `-- meta.xml'de download="true" olduğu için dosyalar resource\n`;
    lua += `-- başlamadan önce MTA tarafından otomatik indirilmiştir.\n`;
    lua += `-- ============================================\n\n`;

    lua += `local function applyMod(mod)\n`;
    lua += `    local txd = engineLoadTXD(mod.txdFile)\n`;
    lua += `    if txd then\n`;
    lua += `        engineImportTXD(txd, tonumber(mod.id))\n`;
    lua += `    else\n`;
    lua += `        outputDebugString("[HATA] TXD yüklenemedi: " .. mod.txdFile, 3, 255, 0, 0)\n`;
    lua += `    end\n`;
    lua += `    \n`;
    lua += `    local dff = engineLoadDFF(mod.dffFile, tonumber(mod.id))\n`;
    lua += `    if dff then\n`;
    lua += `        engineReplaceModel(dff, tonumber(mod.id))\n`;
    lua += `    else\n`;
    lua += `        outputDebugString("[HATA] DFF yüklenemedi: " .. mod.dffFile, 3, 255, 0, 0)\n`;
    lua += `    end\n`;
    lua += `    \n`;
    lua += `    if mod.colFile then\n`;
    lua += `        local col = engineLoadCOL(mod.colFile)\n`;
    lua += `        if col then\n`;
    lua += `            engineReplaceCOL(col, tonumber(mod.id))\n`;
    lua += `        else\n`;
    lua += `            outputDebugString("[HATA] COL yüklenemedi: " .. mod.colFile, 3, 255, 0, 0)\n`;
    lua += `        end\n`;
    lua += `    end\n`;
    lua += `    \n`;
    lua += `    outputDebugString("[Mod Loader] Uygulandı: " .. mod.name .. " (ID: " .. mod.id .. ")", 3, 0, 255, 0)\n`;
    lua += `end\n\n`;

    lua += `addEventHandler("onClientResourceStart", resourceRoot, function()\n`;
    lua += `    for i, mod in ipairs(modsToLoad) do\n`;
    lua += `        applyMod(mod)\n`;
    lua += `    end\n`;
    lua += `    outputDebugString("[Mod Loader] ✓ Tüm modlar başarıyla uygulandı! (Native İndirme)", 3, 0, 255, 0)\n`;
    lua += `end)\n`;

    return lua;
}

// Oyuncunun /mods komutuyla istediği modu kendi ekranında (sunucudaki diğer
// oyuncuları etkilemeden) açıp kapatabilmesini sağlayan istemci taraflı sistem.
// Düşük FPS alan oyuncular bu sayede istemedikleri modelleri kapatabilir.
// Modlar hâlâ indirilirken (isLoading = true) komut kullanılamaz.
function generateModToggleLua() {
    let lua = `\n-- ============================================\n`;
    lua += `-- OYUNCU MOD AÇMA/KAPATMA (/mods komutu)\n`;
    lua += `-- Bu özellik SADECE komutu kullanan oyuncunun kendi ekranını etkiler,\n`;
    lua += `-- sunucudaki veya diğer oyunculardaki görünümü DEĞİŞTİRMEZ.\n`;
    lua += `-- Modlar indirilirken (yükleme ekranı açıkken) komut kullanılamaz.\n`;
    lua += `-- ============================================\n\n`;

    lua += `local modToggleStates = {} -- [modelId] = true (açık) / false (kapalı)\n`;
    lua += `local modToggleWindow = nil\n\n`;

    lua += `local function mtInitToggleStates()\n`;
    lua += `    for i, mod in ipairs(modsToLoad) do\n`;
    lua += `        if modToggleStates[tonumber(mod.id)] == nil then\n`;
    lua += `            modToggleStates[tonumber(mod.id)] = true\n`;
    lua += `        end\n`;
    lua += `    end\n`;
    lua += `end\n\n`;

    lua += `local function mtApplyModVisual(mod)\n`;
    lua += `    local txd = engineLoadTXD(mod.txdFile)\n`;
    lua += `    if txd then\n`;
    lua += `        engineImportTXD(txd, tonumber(mod.id))\n`;
    lua += `    end\n`;
    lua += `    local dff = engineLoadDFF(mod.dffFile, tonumber(mod.id))\n`;
    lua += `    if dff then\n`;
    lua += `        engineReplaceModel(dff, tonumber(mod.id))\n`;
    lua += `    end\n`;
    lua += `    if mod.colFile then\n`;
    lua += `        local col = engineLoadCOL(mod.colFile)\n`;
    lua += `        if col then\n`;
    lua += `            engineReplaceCOL(col, tonumber(mod.id))\n`;
    lua += `        end\n`;
    lua += `    end\n`;
    lua += `end\n\n`;

    lua += `local function mtRestoreModVisual(mod)\n`;
    lua += `    engineRestoreModel(tonumber(mod.id))\n`;
    lua += `    if mod.colFile then\n`;
    lua += `        engineRestoreCOL(tonumber(mod.id))\n`;
    lua += `    end\n`;
    lua += `end\n\n`;

    lua += `local function mtIsToggleAllowed()\n`;
    lua += `    if isLoading then\n`;
    lua += `        outputChatBox("[Mod Loader] Modlar hala indiriliyor, lütfen tamamlanmasını bekleyin.", 255, 200, 0)\n`;
    lua += `        return false\n`;
    lua += `    end\n`;
    lua += `    return true\n`;
    lua += `end\n\n`;

    lua += `local function mtDestroyToggleWindow()\n`;
    lua += `    if modToggleWindow and isElement(modToggleWindow) then\n`;
    lua += `        destroyElement(modToggleWindow)\n`;
    lua += `        modToggleWindow = nil\n`;
    lua += `    end\n`;
    lua += `    showCursor(false)\n`;
    lua += `end\n\n`;

    lua += `local function mtToggleModById(modId)\n`;
    lua += `    for i, mod in ipairs(modsToLoad) do\n`;
    lua += `        if tostring(mod.id) == tostring(modId) then\n`;
    lua += `            local enabled = modToggleStates[tonumber(mod.id)]\n`;
    lua += `            if enabled then\n`;
    lua += `                mtRestoreModVisual(mod)\n`;
    lua += `                modToggleStates[tonumber(mod.id)] = false\n`;
    lua += `                outputChatBox("[Mod Loader] '" .. mod.name .. "' kapatıldı. (Sadece kendi ekranınızda)", 255, 140, 140)\n`;
    lua += `            else\n`;
    lua += `                mtApplyModVisual(mod)\n`;
    lua += `                modToggleStates[tonumber(mod.id)] = true\n`;
    lua += `                outputChatBox("[Mod Loader] '" .. mod.name .. "' açıldı. (Sadece kendi ekranınızda)", 140, 255, 140)\n`;
    lua += `            end\n`;
    lua += `            return\n`;
    lua += `        end\n`;
    lua += `    end\n`;
    lua += `end\n\n`;

    lua += `local function mtBuildToggleWindow()\n`;
    lua += `    mtDestroyToggleWindow()\n`;
    lua += `    mtInitToggleStates()\n`;
    lua += `    \n`;
    lua += `    local sw, sh = guiGetScreenSize()\n`;
    lua += `    local winW, winH = 360, 440\n`;
    lua += `    modToggleWindow = guiCreateWindow((sw - winW) / 2, (sh - winH) / 2, winW, winH, "Mod Aç/Kapat (Sadece Sizde Geçerli)", false)\n`;
    lua += `    guiWindowSetSizable(modToggleWindow, false)\n`;
    lua += `    \n`;
    lua += `    local listBox = guiCreateGridList(10, 28, winW - 20, winH - 78, false, modToggleWindow)\n`;
    lua += `    guiGridListAddColumn(listBox, "Mod Adı", 0.6)\n`;
    lua += `    guiGridListAddColumn(listBox, "Durum", 0.3)\n`;
    lua += `    \n`;
    lua += `    for i, mod in ipairs(modsToLoad) do\n`;
    lua += `        local row = guiGridListAddRow(listBox)\n`;
    lua += `        guiGridListSetItemText(listBox, row, 1, mod.name, false, false)\n`;
    lua += `        local enabled = modToggleStates[tonumber(mod.id)]\n`;
    lua += `        guiGridListSetItemText(listBox, row, 2, enabled and "Açık" or "Kapalı", false, false)\n`;
    lua += `        guiGridListSetItemData(listBox, row, 1, tostring(mod.id))\n`;
    lua += `    end\n`;
    lua += `    \n`;
    lua += `    local toggleBtn = guiCreateButton(10, winH - 42, (winW - 30) / 2, 30, "Seçileni Aç/Kapat", false, modToggleWindow)\n`;
    lua += `    local closeBtn = guiCreateButton(winW / 2 + 5, winH - 42, (winW - 30) / 2, 30, "Kapat", false, modToggleWindow)\n`;
    lua += `    \n`;
    lua += `    addEventHandler("onClientGUIClick", toggleBtn, function()\n`;
    lua += `        local selectedRow = guiGridListGetSelectedItem(listBox)\n`;
    lua += `        if selectedRow and selectedRow ~= -1 then\n`;
    lua += `            local modId = guiGridListGetItemData(listBox, selectedRow, 1)\n`;
    lua += `            mtToggleModById(modId)\n`;
    lua += `            mtBuildToggleWindow()\n`;
    lua += `        end\n`;
    lua += `    end, false)\n`;
    lua += `    \n`;
    lua += `    addEventHandler("onClientGUIClick", closeBtn, function()\n`;
    lua += `        mtDestroyToggleWindow()\n`;
    lua += `    end, false)\n`;
    lua += `    \n`;
    lua += `    showCursor(true)\n`;
    lua += `end\n\n`;

    lua += `addCommandHandler("mods", function()\n`;
    lua += `    if not mtIsToggleAllowed() then return end\n`;
    lua += `    if modToggleWindow and isElement(modToggleWindow) then\n`;
    lua += `        mtDestroyToggleWindow()\n`;
    lua += `    else\n`;
    lua += `        mtBuildToggleWindow()\n`;
    lua += `    end\n`;
    lua += `end)\n\n`;

    lua += `addEventHandler("onClientResourceStop", resourceRoot, function()\n`;
    lua += `    mtDestroyToggleWindow()\n`;
    lua += `end)\n`;

    return lua;
}

// meta.xml oluştur
function generateMetaXml() {
    const downloadAttr = loaderSettings.nativeDownload ? 'true' : 'false';
    const description = loaderSettings.nativeDownload
        ? 'Otomatik Mod Yükleyici (MTA Native İndirme)'
        : 'Otomatik Mod Yükleyici';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<meta>\n`;
    xml += `    <info author="MTA Mod Loader" type="script" description="${description}" />\n`;
    xml += `    <script src="Client.lua" type="client" />\n\n`;
    
    if (modData.vehicles.size > 0) {
        xml += `    <!-- ARAÇ MODLARI -->\n`;
        modData.vehicles.forEach((mod) => {
            if (mod.files.dff) xml += `    <file src="Mods/Araba/${mod.id}.dff" download="${downloadAttr}" />\n`;
            if (mod.files.txd) xml += `    <file src="Mods/Araba/${mod.id}.txd" download="${downloadAttr}" />\n`;
        });
        xml += `\n`;
    }
    
    if (modData.characters.size > 0) {
        xml += `    <!-- KARAKTER MODLARI -->\n`;
        modData.characters.forEach((mod) => {
            if (mod.files.dff) xml += `    <file src="Mods/Karakter/${mod.id}.dff" download="${downloadAttr}" />\n`;
            if (mod.files.txd) xml += `    <file src="Mods/Karakter/${mod.id}.txd" download="${downloadAttr}" />\n`;
        });
        xml += `\n`;
    }
    
    if (modData.objects.size > 0) {
        xml += `    <!-- OBJE MODLARI -->\n`;
        modData.objects.forEach((mod) => {
            if (mod.files.dff) xml += `    <file src="Mods/Obje/${mod.id}.dff" download="${downloadAttr}" />\n`;
            if (mod.files.txd) xml += `    <file src="Mods/Obje/${mod.id}.txd" download="${downloadAttr}" />\n`;
            if (mod.files.col) xml += `    <file src="Mods/Obje/${mod.id}.col" download="${downloadAttr}" />\n`;
        });
        xml += `\n`;
    }
    
    if (modData.weapons.size > 0) {
        xml += `    <!-- SİLAH MODLARI -->\n`;
        modData.weapons.forEach((mod) => {
            const effectiveId = mod.weaponId || mod.id;
            if (mod.files.dff) xml += `    <file src="Mods/Silah/${effectiveId}.dff" download="${downloadAttr}" />\n`;
            if (mod.files.txd) xml += `    <file src="Mods/Silah/${effectiveId}.txd" download="${downloadAttr}" />\n`;
        });
        xml += `\n`;
    }
    
    const bgSlideEnabled = loaderSettings.fullscreenBgEnabled && !loaderSettings.nativeDownload && bgImages.length > 0;
    if (bgSlideEnabled) {
        xml += `    <!-- TAM EKRAN ARKAPLAN SLAYTI GÖRSELLERİ -->\n`;
        // Bu görseller download="true" ile paketlenir: küçük boyutlu, oyun başlamadan önce hazır
        // olması gereken arayüz varlıklarıdır; mod dosyaları gibi kademeli/manuel indirme
        // kuyruğuna girmezler.
        getBgImageEntries().forEach((entry) => {
            xml += `    <file src="${entry.path}" download="true" />\n`;
        });
        xml += `\n`;
    }

    const audioEnabled = loaderSettings.fullscreenBgEnabled && !loaderSettings.nativeDownload && bgAudioTracks.length > 0;
    if (audioEnabled) {
        xml += `    <!-- ARKA PLAN MÜZİKLERİ (MP3) -->\n`;
        getBgAudioEntries().forEach((entry) => {
            xml += `    <file src="${entry.path}" download="true" />\n`;
        });
        xml += `\n`;
    }

    xml += `</meta>\n`;
    return xml;
}

// Önizleme göster
function showPreview(clientLua) {
    const modal = document.getElementById('previewModal');
    const previewCode = document.getElementById('previewCode');
    const fileNameInput = document.getElementById('outputFileName');
    
    previewCode.textContent = clientLua;
    if (fileNameInput) fileNameInput.value = outputFileName;
    modal.classList.add('active');
}

// Modal kapat
function closePreview() {
    const modal = document.getElementById('previewModal');
    modal.classList.remove('active');
}

// Kullanıcının girdiği dosya adını dosya sisteminde güvenli hale getirir
function sanitizeFileName(name) {
    let clean = (name || '').trim();
    clean = clean.replace(/[\\/:*?"<>|]+/g, '_'); // Windows'ta yasak karakterleri temizle
    clean = clean.replace(/\.+$/, ''); // sondaki noktaları kaldır
    clean = clean.slice(0, 60);
    if (!clean) clean = 'MTA_ModLoader';
    return clean;
}

// Script indir
function downloadScript() {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    
    script.onload = function() {
        const JSZip = window.JSZip;
        const zip = new JSZip();
        
        zip.file('Client.lua', window.generatedClientLua);
        zip.file('meta.xml', window.generatedMetaXml);
        
        const modsFolder = zip.folder('Mods');
        
        if (modData.vehicles.size > 0) {
            const vehiclesFolder = modsFolder.folder('Araba');
            modData.vehicles.forEach((mod) => {
                if (mod.files.dff) vehiclesFolder.file(`${mod.id}.dff`, mod.files.dff);
                if (mod.files.txd) vehiclesFolder.file(`${mod.id}.txd`, mod.files.txd);
            });
        }
        
        if (modData.characters.size > 0) {
            const charactersFolder = modsFolder.folder('Karakter');
            modData.characters.forEach((mod) => {
                if (mod.files.dff) charactersFolder.file(`${mod.id}.dff`, mod.files.dff);
                if (mod.files.txd) charactersFolder.file(`${mod.id}.txd`, mod.files.txd);
            });
        }
        
        if (modData.objects.size > 0) {
            const objectsFolder = modsFolder.folder('Obje');
            modData.objects.forEach((mod) => {
                if (mod.files.dff) objectsFolder.file(`${mod.id}.dff`, mod.files.dff);
                if (mod.files.txd) objectsFolder.file(`${mod.id}.txd`, mod.files.txd);
                if (mod.files.col) objectsFolder.file(`${mod.id}.col`, mod.files.col);
            });
        }
        
        if (modData.weapons.size > 0) {
            const weaponsFolder = modsFolder.folder('Silah');
            modData.weapons.forEach((mod) => {
                const effectiveId = mod.weaponId || mod.id;
                if (mod.files.dff) weaponsFolder.file(`${effectiveId}.dff`, mod.files.dff);
                if (mod.files.txd) weaponsFolder.file(`${effectiveId}.txd`, mod.files.txd);
            });
        }

        const bgSlideEnabled = loaderSettings.fullscreenBgEnabled && !loaderSettings.nativeDownload && bgImages.length > 0;
        const audioEnabled = loaderSettings.fullscreenBgEnabled && !loaderSettings.nativeDownload && bgAudioTracks.length > 0;
        if (bgSlideEnabled || audioEnabled) {
            const loaderFolder = zip.folder('Loader');
            if (bgSlideEnabled) {
                getBgImageEntries().forEach((entry) => {
                    loaderFolder.file(entry.fileName, entry.file);
                });
            }
            if (audioEnabled) {
                getBgAudioEntries().forEach((entry) => {
                    loaderFolder.file(entry.fileName, entry.file);
                });
            }
        }
        
        showZipProgress(0);

        zip.generateAsync({ type: 'blob' }, function updateCallback(metadata) {
            showZipProgress(Math.round(metadata.percent));
        }).then(function(content) {
            const finalFileName = sanitizeFileName(outputFileName) + '.zip';
            outputFileName = sanitizeFileName(outputFileName);

            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = finalFileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            hideZipProgress();
            showToast(`"${finalFileName}" indirildi!`, 'success');
            closePreview();
        }).catch(function(error) {
            hideZipProgress();
            showToast('ZIP oluşturulurken hata oluştu: ' + error, 'error');
        });
    };
    
    script.onerror = function() {
        showToast('JSZip kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.', 'error');
    };
    
    document.head.appendChild(script);
}

// ============================================
// ZIP OLUŞTURMA İLERLEME GÖSTERGESİ
// ============================================
function showZipProgress(percent) {
    const overlay = document.getElementById('zipProgressOverlay');
    const fill = document.getElementById('zipProgressFill');
    const percentText = document.getElementById('zipProgressPercent');
    if (!overlay) return;

    overlay.classList.add('active');
    if (fill) fill.style.width = `${percent}%`;
    if (percentText) percentText.textContent = `%${percent}`;
}

function hideZipProgress() {
    const overlay = document.getElementById('zipProgressOverlay');
    if (overlay) overlay.classList.remove('active');
}