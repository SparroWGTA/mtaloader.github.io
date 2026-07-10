

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

// Loader ayarları
const loaderSettings = {
    style: 'panel',
    primaryColor: '#2196F3',
    bgColor: '#222222',
    textColor: '#FFFFFF',
    position: 'bottom',
    barWidth: 40,
    fontSize: 14
};

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
    updateLoaderPreview();
});

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
    
    document.getElementById('primaryColorValue').textContent = primaryColor;
    document.getElementById('bgColorValue').textContent = bgColor;
    document.getElementById('textColorValue').textContent = textColor;
    document.getElementById('barWidthValue').textContent = `${barWidth}%`;
    document.getElementById('fontSizeValue').textContent = `${fontSize}px`;
    
    loaderSettings.style = style;
    loaderSettings.primaryColor = primaryColor;
    loaderSettings.bgColor = bgColor;
    loaderSettings.textColor = textColor;
    loaderSettings.position = position;
    loaderSettings.barWidth = parseInt(barWidth, 10);
    loaderSettings.fontSize = parseInt(fontSize, 10);
    
    preview.style.background = bgColor;
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
    
    fileArray.forEach(file => {
        const filename = file.name;
        const numericMatch = filename.match(/^(\d+)\.(dff|txd|col)$/i);
        const looseMatch = filename.match(/^(.+)\.(dff|txd|col)$/i);
        
        if (numericMatch && validExtensions.includes(numericMatch[2].toLowerCase())) {
            const modId = numericMatch[1];
            const extension = numericMatch[2].toLowerCase();
            
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            
            if (!modData[category].has(modId)) {
                modData[category].set(modId, {
                    id: modId,
                    name: `${category === 'objects' ? 'Obje' : category === 'weapons' ? 'Silah' : category === 'vehicles' ? 'Araç' : 'Karakter'} ${modId}`,
                    files: {},
                    sizes: {},
                    weaponId: null,
                    weaponName: null,
                    needsId: false
                });
            }
            
            const modEntry = modData[category].get(modId);
            modEntry.files[extension] = file;
            modEntry.sizes[extension] = sizeMB;
        } else if (looseMatch && validExtensions.includes(looseMatch[2].toLowerCase())) {
            // Dosya adında sayısal ID yok (örn. "deagle.dff") -> ID'yi kullanıcı elle girecek
            const baseName = looseMatch[1];
            const extension = looseMatch[2].toLowerCase();
            const tempKey = `noid_${baseName.toLowerCase()}`;
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            
            if (!modData[category].has(tempKey)) {
                modData[category].set(tempKey, {
                    id: '',
                    name: `${category === 'objects' ? 'Obje' : category === 'weapons' ? 'Silah' : category === 'vehicles' ? 'Araç' : 'Karakter'} ${baseName}`,
                    files: {},
                    sizes: {},
                    weaponId: null,
                    weaponName: null,
                    needsId: true
                });
            }
            
            const modEntry = modData[category].get(tempKey);
            modEntry.files[extension] = file;
            modEntry.sizes[extension] = sizeMB;
        } else {
            const validExts = category === 'objects' ? '.dff, .txd, .col' : '.dff, .txd';
            alert(`❌ Hatalı dosya adı: ${filename}\n✅ Format: 512${validExts} olmalıdır.`);
        }
    });
    
    updateModsList(category);
}

// Modlar listesini güncelle
function updateModsList(category) {
    const listElement = document.getElementById(`${category}List`);
    const mods = modData[category];
    
    if (mods.size === 0) {
        listElement.innerHTML = '<p class="empty-message">Henüz mod eklenmedi</p>';
        return;
    }
    
    let html = '';
    
    mods.forEach((mod, modId) => {
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
        const idInputClass = mod.needsId ? 'mod-item-id-input missing' : 'mod-item-id-input';
        const idPlaceholder = mod.needsId ? 'ID girin (örn: 512)' : '';
        const idWarning = mod.needsId ? '<span class="mod-item-id-warning">⚠️ Dosya adında ID yok, ID girin</span>' : '';
        const modItemClass = mod.needsId ? 'mod-item needs-id' : 'mod-item';
        
        html += `
            <div class="${modItemClass}">
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
    
    listElement.innerHTML = html;
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
        alert(`⚠️ "${weaponId}" ID'si zaten başka bir silah modu tarafından kullanılıyor! Lütfen önce o modu silin veya farklı bir silah seçin.`);
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
        alert('⚠️ ID sadece rakamlardan oluşmalıdır!');
        updateModsList(category);
        return;
    }
    
    if (newId === oldId) return;
    
    if (modData[category].has(newId)) {
        alert(`⚠️ "${newId}" ID'si zaten kullanılıyor! Lütfen farklı bir ID girin.`);
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
function deleteMod(category, modId) {
    const modName = modData[category].get(modId).name;
    if (confirm(`"${modName}" modunu silmek istediğinize emin misiniz?`)) {
        modData[category].delete(modId);
        updateModsList(category);
    }
}

// Tüm modları temizle
function clearAllMods() {
    if (confirm('Tüm modları silmek istediğinize emin misiniz?')) {
        modData.vehicles.clear();
        modData.characters.clear();
        modData.objects.clear();
        modData.weapons.clear();
        
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
        alert('⚠️ Lütfen en az bir mod ekleyin!');
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
        alert(`⚠️ Şu modların dosya adında ID numarası yok, lütfen "Yüklenen Modlar" listesinden ID girin:\n\n${missingIdMods.join('\n')}`);
        return;
    }
    
    const unassignedWeapons = Array.from(modData.weapons.values()).filter(mod => !mod.weaponId);
    if (unassignedWeapons.length > 0) {
        alert(`⚠️ ${unassignedWeapons.length} silah modu için henüz silah seçilmedi. Lütfen "Yüklenen Modlar" listesinden her mod için bir silah seçin.`);
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
    
    let lua = `-- ============================================\n`;
    lua += `-- MTA San Andreas Mod Loader\n`;
    lua += `-- Otomatik Olarak Oluşturuldu\n`;
    lua += `-- Loader Tarzı: ${loaderSettings.style}\n`;
    lua += `-- Ana Renk: ${loaderSettings.primaryColor}\n`;
    lua += `-- Arka Plan: ${loaderSettings.bgColor}\n`;
    lua += `-- Yazı Rengi: ${loaderSettings.textColor}\n`;
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
    lua += `local textColorRGB = {r = ${textRgb.r}, g = ${textRgb.g}, b = ${textRgb.b}}\n\n`;
    
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
    
    // Yükleme sistemi
    lua += `-- ============================================\n`;
    lua += `-- YÜKLEME SİSTEMİ\n`;
    lua += `-- ============================================\n\n`;
    
    lua += `function loadMods()\n`;
    lua += `    totalMods = #modsToLoad\n`;
    lua += `    currentMod = 0\n`;
    lua += `    isLoading = true\n`;
    lua += `    loadedSize = 0\n`;
    lua += `    totalSize = 0\n`;
    lua += `    \n`;
    lua += `    for i, mod in ipairs(modsToLoad) do\n`;
    lua += `        totalSize = totalSize + mod.size\n`;
    lua += `    end\n`;
    lua += `    \n`;
    lua += `    outputDebugString("[Mod Loader] Modlar yüklenmeye başlandı...", 3, 0, 255, 0)\n`;
    lua += `    loadNextMod()\n`;
    lua += `end\n\n`;
    
    lua += `function loadNextMod()\n`;
    lua += `    if currentMod < totalMods then\n`;
    lua += `        currentMod = currentMod + 1\n`;
    lua += `        local mod = modsToLoad[currentMod]\n`;
    lua += `        \n`;
    lua += `        loadedSize = loadedSize + mod.size\n`;
    lua += `        currentModName = mod.name\n`;
    lua += `        currentModSize = mod.size\n`;
    lua += `        currentPercentage = math.floor((loadedSize / totalSize) * 100)\n`;
    lua += `        local percentage = currentPercentage\n`;
    lua += `        \n`;
    lua += `        outputDebugString("[" .. currentMod .. "/" .. totalMods .. "] Yükleniyor: " .. mod.name .. " (" .. string.format("%.2f", mod.size) .. " MB) - %" .. percentage, 3, 0, 200, 255)\n`;
    lua += `        \n`;
    lua += `        -- TXD dosyasını yükle\n`;
    lua += `        local txd = engineLoadTXD(mod.txdFile)\n`;
    lua += `        if txd then\n`;
    lua += `            engineImportTXD(txd, tonumber(mod.id))\n`;
    lua += `        else\n`;
    lua += `            outputDebugString("[HATA] TXD yüklenemedi: " .. mod.txdFile, 3, 255, 0, 0)\n`;
    lua += `        end\n`;
    lua += `        \n`;
    lua += `        -- DFF dosyasını yükle\n`;
    lua += `        local dff = engineLoadDFF(mod.dffFile)\n`;
    lua += `        if dff then\n`;
    lua += `            engineReplaceModel(dff, tonumber(mod.id))\n`;
    lua += `        else\n`;
    lua += `            outputDebugString("[HATA] DFF yüklenemedi: " .. mod.dffFile, 3, 255, 0, 0)\n`;
    lua += `        end\n`;
    lua += `        \n`;
    lua += `        -- COL dosyasını yükle (Objeler için)\n`;
    lua += `        if mod.colFile then\n`;
    lua += `            local col = engineLoadCOL(mod.colFile)\n`;
    lua += `            if col then\n`;
    lua += `                engineReplaceCOL(col, tonumber(mod.id))\n`;
    lua += `            end\n`;
    lua += `        end\n`;
    lua += `        \n`;
    lua += `        setTimer(loadNextMod, 1000, 1)\n`;
    lua += `    else\n`;
    lua += `        isLoading = false\n`;
    lua += `        outputDebugString("[Mod Loader] ✓ Tüm modlar başarıyla yüklendi!", 3, 0, 255, 0)\n`;
    lua += `    end\n`;
    lua += `end\n\n`;
    
    lua += `-- Oyuncu sunucuya katıldığında modları yükle\n`;
    lua += `addEventHandler("onClientResourceStart", resourceRoot, function()\n`;
    lua += `    loadMods()\n`;
    lua += `end)\n\n`;
    
    // Progress bar (dxDraw) sistemi
    lua += `-- ============================================\n`;
    lua += `-- YÜKLEME EKRANI (PROGRESS BAR)\n`;
    lua += `-- ============================================\n\n`;
    
    lua += `local screenW, screenH = guiGetScreenSize()\n\n`;
    
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
    lua += `    local percentage = currentPercentage\n`;
    lua += `    local modName = currentModName ~= "" and currentModName or "Hazırlanıyor..."\n`;
    lua += `    local modSize = currentModSize\n`;
    lua += `    local bgColorA = tocolor(bgColorRGB.r, bgColorRGB.g, bgColorRGB.b, 255)\n`;
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
    lua += `        -- Panel arka planı\n`;
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
    lua += `        drawLoaderUI()\n`;
    lua += `    end\n`;
    lua += `end)\n`;
    
    return lua;
}

// meta.xml oluştur
function generateMetaXml() {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<meta>\n`;
    xml += `    <info author="MTA Mod Loader" type="script" description="Otomatik Mod Yükleyici" />\n`;
    xml += `    <script src="Client.lua" type="client" />\n\n`;
    
    if (modData.vehicles.size > 0) {
        xml += `    <!-- ARAÇ MODLARI -->\n`;
        modData.vehicles.forEach((mod) => {
            if (mod.files.dff) xml += `    <file src="Mods/Araba/${mod.id}.dff" />\n`;
            if (mod.files.txd) xml += `    <file src="Mods/Araba/${mod.id}.txd" />\n`;
        });
        xml += `\n`;
    }
    
    if (modData.characters.size > 0) {
        xml += `    <!-- KARAKTER MODLARI -->\n`;
        modData.characters.forEach((mod) => {
            if (mod.files.dff) xml += `    <file src="Mods/Karakter/${mod.id}.dff" />\n`;
            if (mod.files.txd) xml += `    <file src="Mods/Karakter/${mod.id}.txd" />\n`;
        });
        xml += `\n`;
    }
    
    if (modData.objects.size > 0) {
        xml += `    <!-- OBJE MODLARI -->\n`;
        modData.objects.forEach((mod) => {
            if (mod.files.dff) xml += `    <file src="Mods/Obje/${mod.id}.dff" />\n`;
            if (mod.files.txd) xml += `    <file src="Mods/Obje/${mod.id}.txd" />\n`;
            if (mod.files.col) xml += `    <file src="Mods/Obje/${mod.id}.col" />\n`;
        });
        xml += `\n`;
    }
    
    if (modData.weapons.size > 0) {
        xml += `    <!-- SİLAH MODLARI -->\n`;
        modData.weapons.forEach((mod) => {
            const effectiveId = mod.weaponId || mod.id;
            if (mod.files.dff) xml += `    <file src="Mods/Silah/${effectiveId}.dff" />\n`;
            if (mod.files.txd) xml += `    <file src="Mods/Silah/${effectiveId}.txd" />\n`;
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
    
    previewCode.textContent = clientLua;
    modal.classList.add('active');
}

// Modal kapat
function closePreview() {
    const modal = document.getElementById('previewModal');
    modal.classList.remove('active');
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
        
        zip.generateAsync({ type: 'blob' }).then(function(content) {
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'MTA_ModLoader.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            alert('✅ ZIP dosyası indirildi!');
            closePreview();
        }).catch(function(error) {
            alert('❌ Hata: ' + error);
        });
    };
    
    script.onerror = function() {
        alert('❌ JSZip kütüphanesi yüklenemedi.');
    };
    
    document.head.appendChild(script);
}