// =====================
// STATE
// =====================
let viewer = null;
let currentMode = 'view';
let scenes = {};
let currentScene = null;
let pendingHotspot = null;
let pendingImages = [];
let hotspotCounter = 0;
let sceneCounter = 0;
let editingHotspotIndex = null;

// Drag states
let isDragging = false;
let dragHotspotIndex = null;
let dragStartCoords = null;
let isCopyDrag = false;

// Dock states
let activeDock = null;
let dockDragging = null;
let dockResizing = null;
let dockOffset = { x: 0, y: 0 };

// Cache
const imageCache = new Map();
const MAX_CACHE_SIZE = 20;
let preloadQueue = [];
let isPreloading = false;

// Defaults
const defaultHotspotStyle = {
    icon: 'arrow_forward',
    color: '#0066ff',
    size: 36,
    opacity: 100,
    tooltipMode: 'hover'
};

// Material Icons for hotspots
const hotspotIcons = [
    'arrow_forward', 'circle', 'radio_button_checked', 'star', 
    'navigation', 'north', 'door_front', 'location_on',
    'info', 'help', 'lightbulb', 'visibility'
];

// Demo scenes
const demoScenes = {
    'demo1': {
        title: 'Demo Sahne 1',
        panorama: 'https://pannellum.org/images/alma.jpg',
        fileName: null,
        imageBlob: null,
        hotSpots: []
    },
    'demo2': {
        title: 'Demo Sahne 2',
        panorama: 'https://pannellum.org/images/cerro-toco-0.jpg',
        fileName: null,
        imageBlob: null,
        hotSpots: []
    }
};

// =====================
// INIT
// =====================
function init() {
    scenes = { ...demoScenes };
    
    initDockSystem();
    initViewer('demo1');
    updateSceneList();
    updateHotspotList();
    setupDragAndDrop();
    setupKeyboardShortcuts();
    setupIconSelector();
    setupHotspotTypeSelector();
    loadDockPositions();
    
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    document.getElementById('configInput').addEventListener('change', handleConfigUpload);
    
    loadFromSaved();
}

// =====================
// DOCK SYSTEM
// =====================
function initDockSystem() {
    document.querySelectorAll('.dock').forEach(dock => {
        const header = dock.querySelector('.dock-header');
        const resize = dock.querySelector('.dock-resize');
        
        // Drag
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.dock-btn')) return;
            dockDragging = dock;
            const rect = dock.getBoundingClientRect();
            dockOffset.x = e.clientX - rect.left;
            dockOffset.y = e.clientY - rect.top;
            dock.classList.add('focused');
            focusDock(dock);
        });
        
        // Resize
        if (resize) {
            resize.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                dockResizing = dock;
                focusDock(dock);
            });
        }
        
        // Focus on click
        dock.addEventListener('mousedown', () => focusDock(dock));
    });
    
    document.addEventListener('mousemove', (e) => {
        if (dockDragging) {
            const x = Math.max(0, Math.min(e.clientX - dockOffset.x, window.innerWidth - 100));
            const y = Math.max(0, Math.min(e.clientY - dockOffset.y, window.innerHeight - 50));
            dockDragging.style.left = x + 'px';
            dockDragging.style.top = y + 'px';
            dockDragging.style.right = 'auto';
            dockDragging.style.bottom = 'auto';
        }
        
        if (dockResizing) {
            const rect = dockResizing.getBoundingClientRect();
            const width = Math.max(200, e.clientX - rect.left);
            const height = Math.max(100, e.clientY - rect.top);
            dockResizing.style.width = width + 'px';
            dockResizing.style.height = height + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (dockDragging || dockResizing) {
            saveDockPositions();
        }
        dockDragging = null;
        dockResizing = null;
    });
}

function focusDock(dock) {
    document.querySelectorAll('.dock').forEach(d => d.classList.remove('focused'));
    dock.classList.add('focused');
    activeDock = dock;
}

function toggleDock(dockId) {
    const dock = document.getElementById(dockId);
    dock.classList.toggle('hidden');
    saveDockPositions();
}

function minimizeDock(dockId) {
    const dock = document.getElementById(dockId);
    dock.classList.toggle('minimized');
    saveDockPositions();
}

function saveDockPositions() {
    const positions = {};
    document.querySelectorAll('.dock').forEach(dock => {
        positions[dock.id] = {
            left: dock.style.left,
            top: dock.style.top,
            width: dock.style.width,
            height: dock.style.height,
            hidden: dock.classList.contains('hidden'),
            minimized: dock.classList.contains('minimized')
        };
    });
    localStorage.setItem('dock_positions', JSON.stringify(positions));
}

function loadDockPositions() {
    const saved = localStorage.getItem('dock_positions');
    if (!saved) return;
    
    try {
        const positions = JSON.parse(saved);
        Object.entries(positions).forEach(([id, pos]) => {
            const dock = document.getElementById(id);
            if (!dock) return;
            
            if (pos.left) dock.style.left = pos.left;
            if (pos.top) dock.style.top = pos.top;
            if (pos.width) dock.style.width = pos.width;
            if (pos.height) dock.style.height = pos.height;
            if (pos.hidden) dock.classList.add('hidden');
            if (pos.minimized) dock.classList.add('minimized');
            
            dock.style.right = 'auto';
            dock.style.bottom = 'auto';
        });
    } catch (e) {
        console.log('Failed to load dock positions');
    }
}

function resetDocks() {
    localStorage.removeItem('dock_positions');
    location.reload();
}

// =====================
// VIEWER
// =====================
function initViewer(sceneId) {
    const config = {
        default: {
            firstScene: sceneId,
            sceneFadeDuration: 150,
            autoLoad: true,
            compass: false,
            showControls: false,
            mouseZoom: true,
            keyboardZoom: true,
            friction: 0.12,
            yaw: 0,
            pitch: 0,
            hfov: 100,
            minHfov: 30,
            maxHfov: 120,
            maxPitch: 90,
            minPitch: -90,
            autoRotate: 0,
            orientationOnByDefault: false,
            draggable: true,
            disableKeyboardCtrl: false,
            showFullscreenCtrl: false,
            showZoomCtrl: false
        },
        scenes: {}
    };

    for (const [id, scene] of Object.entries(scenes)) {
        config.scenes[id] = {
            title: scene.title,
            panorama: scene.panorama,
            type: 'equirectangular',
            hotSpots: scene.hotSpots.map(hs => ({
                id: hs.id,
                pitch: hs.pitch,
                yaw: hs.yaw,
                type: 'info',
                createTooltipFunc: createCustomHotspot,
                createTooltipArgs: {
                    text: hs.text,
                    icon: hs.icon || defaultHotspotStyle.icon,
                    color: hs.color || defaultHotspotStyle.color,
                    size: hs.size || defaultHotspotStyle.size,
                    opacity: hs.opacity ?? defaultHotspotStyle.opacity,
                    tooltipMode: hs.tooltipMode || defaultHotspotStyle.tooltipMode,
                    hotspotType: hs.hotspotType || 'nav',
                    description: hs.description || '',
                    hotspotId: hs.id,
                    sceneId: hs.sceneId
                }
            }))
        };
    }

    if (viewer) viewer.destroy();

    viewer = pannellum.viewer('panorama', config);
    currentScene = sceneId;

    viewer.on('mousedown', handlePanoramaClick);
    viewer.on('scenechange', onSceneChange);

    setInterval(updateCoords, 100);

    touchCache(sceneId);
    preloadAdjacentScenes(sceneId);
    setTimeout(() => preloadAllScenes(), 500);

    updateSceneList();
    updateHotspotList();
    updateStatusBar();
}

function createCustomHotspot(hotSpotDiv, args) {
    const { text, icon, color, size, opacity, tooltipMode, hotspotType, description, hotspotId, sceneId } = args;

    const wrapper = document.createElement('div');
    wrapper.className = `custom-hotspot hotspot-${hotspotType} tooltip-${tooltipMode || 'hover'}`;
    wrapper.style.width = size + 'px';
    wrapper.style.height = size + 'px';
    wrapper.style.opacity = opacity / 100;
    wrapper.style.color = color;
    wrapper.dataset.hotspotId = hotspotId;

    const iconEl = document.createElement('div');
    iconEl.className = 'custom-hotspot-icon';
    iconEl.style.background = color;
    iconEl.style.fontSize = (size * 0.5) + 'px';
    iconEl.innerHTML = `<span class="material-symbols-rounded">${icon}</span>`;
    wrapper.appendChild(iconEl);

    const tooltip = document.createElement('div');
    tooltip.className = 'hotspot-tooltip';
    tooltip.textContent = text;
    wrapper.appendChild(tooltip);

    // Drag state
    let dragStartX, dragStartY;

    wrapper.addEventListener('mousedown', (e) => {
        if (currentMode === 'edit') {
            e.stopPropagation();
            e.preventDefault();
            
            const index = findHotspotIndexById(hotspotId);
            if (index === -1) return;

            isDragging = true;
            window.hasDragged = false;
            dragHotspotIndex = index;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            window.dragStartX = e.clientX;
            window.dragStartY = e.clientY;
            isCopyDrag = e.ctrlKey || e.metaKey;
            
            const hs = scenes[currentScene].hotSpots[index];
            dragStartCoords = { pitch: hs.pitch, yaw: hs.yaw };

            wrapper.classList.add('dragging');
            if (isCopyDrag) wrapper.classList.add('copy-drag');
        }
    });

    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Edit modda ve sürükleme olmadıysa düzenleme modalı aç
        if (currentMode === 'edit' && !window.hasDragged) {
            const index = findHotspotIndexById(hotspotId);
            if (index !== -1) editHotspot(index);
            return;
        }
        
        // View modda
        if (currentMode === 'view') {
            if (hotspotType === 'info') {
                console.log('Info hotspot clicked:', { text, description });
                showInfoPanel(text, description || 'Açıklama girilmemiş.');
            } else if (hotspotType === 'nav' && sceneId) {
                // Navigasyon hotspot - sahne değiştir
                switchScene(sceneId);
            }
        }
    });

    hotSpotDiv.appendChild(wrapper);
}

function findHotspotIndexById(id) {
    return (scenes[currentScene]?.hotSpots || []).findIndex(hs => hs.id === id);
}

// Global mouse handlers for hotspot dragging
document.addEventListener('mousemove', (e) => {
    if (!isDragging || dragHotspotIndex === null) return;
    
    const dx = Math.abs(e.clientX - (window.dragStartX || 0));
    const dy = Math.abs(e.clientY - (window.dragStartY || 0));
    
    if (dx > 5 || dy > 5) {
        window.hasDragged = true;
    }
});

document.addEventListener('mouseup', (e) => {
    if (!isDragging || dragHotspotIndex === null) {
        isDragging = false;
        return;
    }
    
    document.querySelectorAll('.custom-hotspot.dragging').forEach(el => {
        el.classList.remove('dragging', 'copy-drag');
    });
    
    // Sadece gerçekten sürüklediyse taşı/kopyala
    if (window.hasDragged) {
        const coords = viewer.mouseEventToCoords({ clientX: e.clientX, clientY: e.clientY });
        
        if (coords) {
            if (isCopyDrag) {
                copyHotspot(dragHotspotIndex, coords[0], coords[1]);
            } else {
                moveHotspot(dragHotspotIndex, coords[0], coords[1]);
            }
        }
    }
    
    isDragging = false;
    dragHotspotIndex = null;
    dragStartCoords = null;
    isCopyDrag = false;
    window.hasDragged = false;
});

function moveHotspot(index, newPitch, newYaw) {
    const hs = scenes[currentScene].hotSpots[index];
    if (!hs) return;
    
    viewer.removeHotSpot(hs.id, currentScene);
    hs.pitch = newPitch;
    hs.yaw = newYaw;
    addHotspotToViewer(hs);
    updateHotspotList();
}

function copyHotspot(index, newPitch, newYaw) {
    const original = scenes[currentScene].hotSpots[index];
    if (!original) return;
    
    const newHotspot = {
        ...original,
        id: `hs_${++hotspotCounter}`,
        pitch: newPitch,
        yaw: newYaw,
        text: original.text + ' (kopya)'
    };
    
    scenes[currentScene].hotSpots.push(newHotspot);
    addHotspotToViewer(newHotspot);
    updateHotspotList();
}

function addHotspotToViewer(hs) {
    viewer.addHotSpot({
        id: hs.id,
        pitch: hs.pitch,
        yaw: hs.yaw,
        type: 'info',
        createTooltipFunc: createCustomHotspot,
        createTooltipArgs: {
            text: hs.text,
            icon: hs.icon,
            color: hs.color,
            size: hs.size,
            opacity: hs.opacity,
            tooltipMode: hs.tooltipMode,
            hotspotType: hs.hotspotType,
            description: hs.description,
            hotspotId: hs.id,
            sceneId: hs.sceneId
        }
    }, currentScene);
}

// =====================
// SCENES
// =====================
function switchScene(sceneId) {
    if (sceneId === currentScene) return;
    
    if (imageCache.has(sceneId)) {
        viewer.loadScene(sceneId);
    } else {
        preloadScene(sceneId).then(() => viewer.loadScene(sceneId));
    }
    
    currentScene = sceneId;
    updateSceneList();
    updateHotspotList();
    updateStatusBar();
}

function onSceneChange(sceneId) {
    currentScene = sceneId;
    updateSceneList();
    updateHotspotList();
    updateStatusBar();
    touchCache(sceneId);
    preloadAdjacentScenes(sceneId);
    setTimeout(() => garbageCollect(sceneId), 1000);
}

function changeSceneImage(sceneId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const scene = scenes[sceneId];
            if (scene) {
                scene.panorama = event.target.result;
                scene.imageBlob = file;
                scene.fileName = file.name;
                
                // Clear cache for this scene
                if (imageCache.has(sceneId)) {
                    const data = imageCache.get(sceneId);
                    if (data.url?.startsWith('blob:')) URL.revokeObjectURL(data.url);
                    imageCache.delete(sceneId);
                }
                
                // Reload viewer if this is the current scene
                if (currentScene === sceneId) {
                    const yaw = viewer.getYaw();
                    const pitch = viewer.getPitch();
                    initViewer(sceneId);
                    viewer.setYaw(yaw);
                    viewer.setPitch(pitch);
                } else {
                    updateSceneList();
                }
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function deleteScene(sceneId) {
    if (Object.keys(scenes).length <= 1) {
        alert('En az bir sahne olmalıdır!');
        return;
    }
    if (!confirm(`"${scenes[sceneId].title}" sahnesini silmek istediğinize emin misiniz?`)) return;

    for (const scene of Object.values(scenes)) {
        scene.hotSpots = scene.hotSpots.filter(hs => hs.sceneId !== sceneId);
    }
    delete scenes[sceneId];

    if (currentScene === sceneId) {
        initViewer(Object.keys(scenes)[0]);
    } else {
        updateSceneList();
    }
}

function updateSceneList() {
    const list = document.getElementById('sceneList');
    
    if (Object.keys(scenes).length === 0) {
        list.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded">view_in_ar</span>Henüz sahne yok</div>';
        return;
    }
    
    list.innerHTML = '';
    for (const [id, scene] of Object.entries(scenes)) {
        const item = document.createElement('div');
        item.className = `list-item ${id === currentScene ? 'active' : ''}`;
        item.innerHTML = `
            <div class="list-item-icon"><span class="material-symbols-rounded">panorama_photosphere</span></div>
            <div class="list-item-info" onclick="switchScene('${id}')">
                <div class="list-item-name">${scene.title}</div>
                <div class="list-item-meta">${scene.hotSpots.length} hotspot</div>
            </div>
            <div class="list-item-actions">
                <button class="list-item-btn" onclick="event.stopPropagation(); changeSceneImage('${id}')" title="Görseli Değiştir">
                    <span class="material-symbols-rounded">image</span>
                </button>
                <button class="list-item-btn delete" onclick="event.stopPropagation(); deleteScene('${id}')">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
        `;
        list.appendChild(item);
    }
}

// =====================
// HOTSPOTS
// =====================
function handlePanoramaClick(event) {
    if (currentMode !== 'add') return;
    if (isDragging) return;

    const coords = viewer.mouseEventToCoords(event);
    if (!coords) return;

    pendingHotspot = { pitch: coords[0], yaw: coords[1] };
    editingHotspotIndex = null;
    openHotspotModal(coords[0], coords[1]);
}

function editHotspot(index) {
    const hs = scenes[currentScene].hotSpots[index];
    if (!hs) return;
    editingHotspotIndex = index;
    pendingHotspot = { pitch: hs.pitch, yaw: hs.yaw };
    openHotspotModal(hs.pitch, hs.yaw, hs);
}

function deleteHotspot(index) {
    const hs = scenes[currentScene].hotSpots[index];
    viewer.removeHotSpot(hs.id, currentScene);
    scenes[currentScene].hotSpots.splice(index, 1);
    updateHotspotList();
}

function updateHotspotList() {
    const list = document.getElementById('hotspotList');
    const hotspots = scenes[currentScene]?.hotSpots || [];
    
    if (hotspots.length === 0) {
        list.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded">ads_click</span>Hotspot yok</div>';
        return;
    }
    
    list.innerHTML = '';
    hotspots.forEach((hs, index) => {
        const isNav = hs.hotspotType !== 'info';
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-icon" style="background: ${hs.color || '#0066ff'}">
                <span class="material-symbols-rounded" style="color: #fff; font-size: 14px;">${hs.icon || 'arrow_forward'}</span>
            </div>
            <div class="list-item-info">
                <div class="list-item-name">
                    ${hs.text}
                    <span class="type-badge ${isNav ? 'nav' : 'info'}">${isNav ? 'NAV' : 'INFO'}</span>
                </div>
                <div class="list-item-meta">${isNav ? '→ ' + (scenes[hs.sceneId]?.title || '?') : 'Bilgi'}</div>
            </div>
            <div class="list-item-actions">
                <button class="list-item-btn" onclick="editHotspot(${index})">
                    <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="list-item-btn delete" onclick="deleteHotspot(${index})">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

// =====================
// HOTSPOT MODAL
// =====================
function setupHotspotTypeSelector() {
    document.querySelectorAll('.type-option').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.type-option').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            updateHotspotFormSections();
            updateHotspotPreview();
        });
    });
}

function updateHotspotFormSections() {
    const type = getSelectedHotspotType();
    document.getElementById('navFields').classList.toggle('show', type === 'nav');
    document.getElementById('infoFields').classList.toggle('show', type === 'info');
}

function getSelectedHotspotType() {
    return document.querySelector('.type-option.selected')?.dataset.type || 'nav';
}

function setupIconSelector() {
    const container = document.getElementById('iconSelector');
    container.innerHTML = '';
    
    hotspotIcons.forEach(icon => {
        const el = document.createElement('div');
        el.className = 'icon-option';
        el.dataset.icon = icon;
        el.innerHTML = `<span class="material-symbols-rounded">${icon}</span>`;
        if (icon === defaultHotspotStyle.icon) el.classList.add('selected');
        el.onclick = () => {
            document.querySelectorAll('.icon-option').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            updateHotspotPreview();
        };
        container.appendChild(el);
    });

    document.getElementById('hotspotColor').addEventListener('input', updateHotspotPreview);
    document.getElementById('hotspotSize').addEventListener('input', (e) => {
        document.getElementById('hotspotSizeValue').textContent = e.target.value + 'px';
        updateHotspotPreview();
    });
    document.getElementById('hotspotOpacity').addEventListener('input', (e) => {
        document.getElementById('hotspotOpacityValue').textContent = e.target.value + '%';
        updateHotspotPreview();
    });
}

function getSelectedIcon() {
    return document.querySelector('.icon-option.selected')?.dataset.icon || defaultHotspotStyle.icon;
}

function updateHotspotPreview() {
    const color = document.getElementById('hotspotColor').value;
    const size = parseInt(document.getElementById('hotspotSize').value);
    const opacity = parseInt(document.getElementById('hotspotOpacity').value) / 100;
    const icon = getSelectedIcon();

    document.getElementById('hotspotPreview').innerHTML = `
        <div class="hotspot-preview-item" style="width: ${size}px; height: ${size}px; background: ${color}; opacity: ${opacity}; font-size: ${size * 0.5}px;">
            <span class="material-symbols-rounded">${icon}</span>
        </div>
    `;
}

function openHotspotModal(pitch, yaw, existing = null) {
    document.getElementById('hotspotCoords').value = `P: ${pitch.toFixed(1)}° Y: ${yaw.toFixed(1)}°`;
    
    const isEdit = !!existing;
    document.getElementById('hotspotModalTitle').textContent = isEdit ? 'Hotspot Düzenle' : 'Yeni Hotspot';
    
    document.getElementById('hotspotName').value = existing?.text || '';
    document.getElementById('hotspotColor').value = existing?.color || defaultHotspotStyle.color;
    document.getElementById('hotspotSize').value = existing?.size || defaultHotspotStyle.size;
    document.getElementById('hotspotSizeValue').textContent = (existing?.size || defaultHotspotStyle.size) + 'px';
    document.getElementById('hotspotOpacity').value = existing?.opacity ?? defaultHotspotStyle.opacity;
    document.getElementById('hotspotOpacityValue').textContent = (existing?.opacity ?? defaultHotspotStyle.opacity) + '%';
    document.getElementById('hotspotDescription').value = existing?.description || '';
    document.getElementById('tooltipMode').value = existing?.tooltipMode || defaultHotspotStyle.tooltipMode;
    
    document.querySelectorAll('.icon-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.icon === (existing?.icon || defaultHotspotStyle.icon));
    });
    
    const hsType = existing?.hotspotType || 'nav';
    document.querySelectorAll('.type-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.type === hsType);
    });
    
    updateHotspotFormSections();
    updateHotspotPreview();
    
    const select = document.getElementById('targetScene');
    select.innerHTML = '<option value="">Sahne seçin...</option>';
    for (const [id, scene] of Object.entries(scenes)) {
        if (id !== currentScene) {
            select.innerHTML += `<option value="${id}">${scene.title}</option>`;
        }
    }
    if (existing?.sceneId) select.value = existing.sceneId;
    
    document.getElementById('hotspotModal').classList.add('show');
    document.getElementById('hotspotName').focus();
}

function closeHotspotModal() {
    document.getElementById('hotspotModal').classList.remove('show');
    pendingHotspot = null;
    editingHotspotIndex = null;
}

function confirmAddHotspot() {
    if (!pendingHotspot && editingHotspotIndex === null) return;

    const name = document.getElementById('hotspotName').value || 'Hotspot';
    const hotspotType = getSelectedHotspotType();
    const targetScene = document.getElementById('targetScene').value;
    const description = document.getElementById('hotspotDescription').value;
    const color = document.getElementById('hotspotColor').value;
    const size = parseInt(document.getElementById('hotspotSize').value);
    const opacity = parseInt(document.getElementById('hotspotOpacity').value);
    const tooltipMode = document.getElementById('tooltipMode').value;
    const icon = getSelectedIcon();

    if (hotspotType === 'nav' && !targetScene) {
        alert('Lütfen bir hedef sahne seçin!');
        return;
    }

    const hotspotData = {
        id: editingHotspotIndex !== null ? scenes[currentScene].hotSpots[editingHotspotIndex].id : `hs_${++hotspotCounter}`,
        pitch: pendingHotspot?.pitch ?? scenes[currentScene].hotSpots[editingHotspotIndex].pitch,
        yaw: pendingHotspot?.yaw ?? scenes[currentScene].hotSpots[editingHotspotIndex].yaw,
        hotspotType, text: name, sceneId: hotspotType === 'nav' ? targetScene : null,
        description: hotspotType === 'info' ? description : '',
        icon, color, size, opacity, tooltipMode
    };

    if (editingHotspotIndex !== null) {
        viewer.removeHotSpot(scenes[currentScene].hotSpots[editingHotspotIndex].id, currentScene);
        scenes[currentScene].hotSpots[editingHotspotIndex] = hotspotData;
    } else {
        scenes[currentScene].hotSpots.push(hotspotData);
    }

    addHotspotToViewer(hotspotData);
    closeHotspotModal();
    updateHotspotList();

    if (hotspotType === 'nav' && targetScene && !imageCache.has(targetScene)) {
        preloadQueue.unshift(targetScene);
        processPreloadQueue();
    }
}

// =====================
// INFO PANEL
// =====================
function showInfoPanel(title, description) {
    const panel = document.getElementById('infoPanel');
    const titleEl = document.getElementById('infoPanelTitle');
    const descEl = document.getElementById('infoPanelDescription');
    
    titleEl.textContent = title || 'Bilgi';
    descEl.textContent = description || 'Açıklama girilmemiş.';
    
    panel.classList.add('show');
    console.log('Info panel opened:', { title, description });
}

function closeInfoPanel() {
    document.getElementById('infoPanel').classList.remove('show');
}

// =====================
// MODE MANAGEMENT
// =====================
function setMode(mode) {
    currentMode = mode;
    document.body.classList.remove('mode-view', 'mode-edit', 'mode-add');
    document.body.classList.add(`mode-${mode}`);
    
    document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`)?.classList.add('active');
    
    updateStatusBar();
}

function toggleEditMode() { setMode(currentMode === 'edit' ? 'view' : 'edit'); }
function toggleAddMode() { setMode(currentMode === 'add' ? 'view' : 'add'); }

// =====================
// STATUS BAR
// =====================
function updateCoords() {
    if (!viewer) return;
    document.getElementById('pitchVal').textContent = viewer.getPitch().toFixed(1);
    document.getElementById('yawVal').textContent = viewer.getYaw().toFixed(1);
}

function updateStatusBar() {
    document.getElementById('statusScene').textContent = scenes[currentScene]?.title || '-';
    document.getElementById('statusMode').textContent = currentMode.toUpperCase();
}

// =====================
// FILE HANDLING
// =====================
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const fullscreenDrop = document.getElementById('fullscreenDrop');
    const imageInput = document.getElementById('imageInput');

    dropZone?.addEventListener('click', () => imageInput.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
        dropZone?.addEventListener(e, preventDefaults);
        document.body.addEventListener(e, preventDefaults);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    let dragCounter = 0;
    document.body.addEventListener('dragenter', (e) => {
        dragCounter++;
        if (e.dataTransfer.types.includes('Files')) fullscreenDrop.classList.add('show');
    });
    document.body.addEventListener('dragleave', () => {
        dragCounter--;
        if (dragCounter === 0) fullscreenDrop.classList.remove('show');
    });
    document.body.addEventListener('drop', (e) => {
        dragCounter = 0;
        fullscreenDrop.classList.remove('show');
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(files) {
    pendingImages = [];
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    let loaded = 0;
    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '_');
            pendingImages.push({ data: e.target.result, blob: file, name: baseName, fileName: file.name });
            if (++loaded === imageFiles.length) processNextImage();
        };
        reader.readAsDataURL(file);
    });
}

function processNextImage() {
    if (pendingImages.length === 0) return;
    document.getElementById('sceneName').value = pendingImages[0].name;
    document.getElementById('sceneModal').classList.add('show');
}

function handleImageUpload(e) {
    if (e.target.files.length) handleFiles(e.target.files);
    e.target.value = '';
}

function closeSceneModal() {
    document.getElementById('sceneModal').classList.remove('show');
    pendingImages = [];
}

function confirmAddScene() {
    if (pendingImages.length === 0) return;
    const img = pendingImages.shift();
    const name = document.getElementById('sceneName').value || `Sahne ${Object.keys(scenes).length + 1}`;
    const id = `scene_${++sceneCounter}`;

    scenes[id] = { title: name, panorama: img.data, fileName: img.fileName, imageBlob: img.blob, hotSpots: [] };
    closeSceneModal();

    if (Object.keys(scenes).length === 1) {
        initViewer(id);
    } else {
        const yaw = viewer.getYaw(), pitch = viewer.getPitch();
        initViewer(currentScene);
        viewer.setYaw(yaw); viewer.setPitch(pitch);
    }
    updateSceneList();

    if (pendingImages.length > 0) {
        setTimeout(() => { document.getElementById('sceneName').value = pendingImages[0].name; document.getElementById('sceneModal').classList.add('show'); }, 300);
    }
}

// =====================
// KEYBOARD
// =====================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
        
        switch (e.key.toLowerCase()) {
            case 'e': toggleEditMode(); break;
            case 'a': toggleAddMode(); break;
            case 'escape': setMode('view'); closeHotspotModal(); closeSceneModal(); closeInfoPanel(); break;
            case 's': if (e.ctrlKey || e.metaKey) { e.preventDefault(); saveProject(); } break;
        }
    });
}

// =====================
// SAVE / LOAD
// =====================
function showLoading(text = 'İşleniyor...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

async function saveProject() {
    showLoading('Kaydediliyor...');
    try {
        const zip = new JSZip();
        const imgFolder = zip.folder("images");
        const config = { scenes: {}, version: '2.0' };
        let imgIndex = 0;

        for (const [id, scene] of Object.entries(scenes)) {
            let imagePath = null;
            if (scene.imageBlob) {
                const fileName = scene.fileName || `panorama_${++imgIndex}.jpg`;
                imgFolder.file(fileName, scene.imageBlob);
                imagePath = `images/${fileName}`;
            } else if (scene.panorama.startsWith('http')) {
                imagePath = scene.panorama;
            } else if (scene.panorama.startsWith('data:')) {
                const fileName = `panorama_${++imgIndex}.jpg`;
                imgFolder.file(fileName, scene.panorama.split(',')[1], { base64: true });
                imagePath = `images/${fileName}`;
            }

            config.scenes[id] = {
                title: scene.title,
                panorama: imagePath,
                hotSpots: scene.hotSpots.map(hs => ({
                    pitch: hs.pitch, yaw: hs.yaw, text: hs.text, hotspotType: hs.hotspotType || 'nav',
                    sceneId: hs.sceneId, description: hs.description || '', icon: hs.icon, color: hs.color,
                    size: hs.size, opacity: hs.opacity, tooltipMode: hs.tooltipMode
                }))
            };
        }

        zip.file("config.json", JSON.stringify(config, null, 2));
        const content = await zip.generateAsync({ type: "blob" });

        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url; a.download = 'recent.zip'; a.click();
        URL.revokeObjectURL(url);

        const base64 = await zip.generateAsync({ type: "base64" });
        if (base64.length < 5 * 1024 * 1024) localStorage.setItem('panorama_autosave', base64);
    } catch (err) {
        console.error(err);
        alert('Kaydetme hatası!');
    } finally {
        hideLoading();
    }
}

async function loadFromSaved() {
    const saved = localStorage.getItem('panorama_autosave');
    if (saved) {
        try {
            await loadFromZip(await JSZip.loadAsync(saved, { base64: true }), false);
            return;
        } catch (e) { console.log('Autosave failed'); }
    }
    try {
        const res = await fetch('saved/recent.zip');
        if (res.ok) await loadFromZip(await JSZip.loadAsync(await res.blob()), false);
    } catch (e) { }
}

async function handleConfigUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    showLoading('Yükleniyor...');
    try {
        if (file.name.endsWith('.zip')) {
            await loadFromZip(await JSZip.loadAsync(file), true);
        }
    } catch (err) { alert('Yükleme hatası!'); }
    finally { hideLoading(); }
    e.target.value = '';
}

async function loadFromZip(zip, showProgress = true) {
    const configFile = zip.file("config.json");
    if (!configFile) { if (showProgress) hideLoading(); return; }

    const config = JSON.parse(await configFile.async("string"));
    scenes = {};
    hotspotCounter = 0;
    sceneCounter = 0;

    for (const [id, scene] of Object.entries(config.scenes)) {
        let panoramaData = null, imageBlob = null, fileName = null;

        if (scene.panorama?.startsWith('images/')) {
            fileName = scene.panorama.replace('images/', '');
            const imgFile = zip.file(scene.panorama);
            if (imgFile) {
                imageBlob = await imgFile.async("blob");
                panoramaData = URL.createObjectURL(imageBlob);
            }
        } else if (scene.panorama?.startsWith('http')) {
            panoramaData = scene.panorama;
        }

        if (panoramaData) {
            sceneCounter++;
            scenes[id] = {
                title: scene.title, panorama: panoramaData, fileName, imageBlob,
                hotSpots: scene.hotSpots.map(hs => ({
                    id: `hs_${++hotspotCounter}`, pitch: hs.pitch, yaw: hs.yaw, hotspotType: hs.hotspotType || 'nav',
                    text: hs.text, sceneId: hs.sceneId, description: hs.description || '', icon: hs.icon || defaultHotspotStyle.icon,
                    color: hs.color || defaultHotspotStyle.color, size: hs.size || defaultHotspotStyle.size,
                    opacity: hs.opacity ?? defaultHotspotStyle.opacity, tooltipMode: hs.tooltipMode || defaultHotspotStyle.tooltipMode
                }))
            };
        }
    }

    if (Object.keys(scenes).length > 0) initViewer(Object.keys(scenes)[0]);
    if (showProgress) hideLoading();
}

function clearAutoSave() {
    localStorage.removeItem('panorama_autosave');
    alert('Auto-save temizlendi.');
}

// =====================
// CACHE
// =====================
function touchCache(id) { if (imageCache.has(id)) imageCache.get(id).lastUsed = Date.now(); }

function preloadAdjacentScenes(sceneId) {
    const hs = scenes[sceneId]?.hotSpots || [];
    hs.filter(h => h.hotspotType !== 'info' && h.sceneId && scenes[h.sceneId])
      .forEach(h => { if (!imageCache.has(h.sceneId) && !preloadQueue.includes(h.sceneId)) preloadQueue.unshift(h.sceneId); });
    processPreloadQueue();
}

function preloadAllScenes() {
    Object.keys(scenes).forEach(id => { if (!imageCache.has(id) && !preloadQueue.includes(id)) preloadQueue.push(id); });
    processPreloadQueue();
}

function processPreloadQueue() {
    if (isPreloading || preloadQueue.length === 0) return;
    isPreloading = true;
    preloadScene(preloadQueue.shift()).finally(() => { isPreloading = false; if (preloadQueue.length > 0) setTimeout(processPreloadQueue, 50); });
}

function preloadScene(id) {
    return new Promise(resolve => {
        if (imageCache.has(id)) { touchCache(id); resolve(); return; }
        const scene = scenes[id];
        if (!scene?.panorama) { resolve(); return; }
        const img = new Image();
        img.onload = () => { imageCache.set(id, { img, lastUsed: Date.now(), url: scene.panorama }); resolve(); };
        img.onerror = () => resolve();
        img.src = scene.panorama;
    });
}

function garbageCollect(currentId) {
    if (imageCache.size <= MAX_CACHE_SIZE) return;
    const protect = new Set([currentId, ...(scenes[currentId]?.hotSpots || []).map(h => h.sceneId).filter(Boolean)]);
    const entries = [...imageCache.entries()].filter(([id]) => !protect.has(id)).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    const toRemove = imageCache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove && i < entries.length; i++) {
        const [id, data] = entries[i];
        if (data.url?.startsWith('blob:')) URL.revokeObjectURL(data.url);
        imageCache.delete(id);
    }
}

function clearAllCache() {
    imageCache.forEach(d => { if (d.url?.startsWith('blob:')) URL.revokeObjectURL(d.url); });
    imageCache.clear();
    preloadQueue = [];
    isPreloading = false;
}

// =====================
// START
// =====================
document.addEventListener('DOMContentLoaded', init);