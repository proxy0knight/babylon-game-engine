import { Router } from '@/utils/Router';
import { getDefaultSceneCode } from '@/assets/defaultScene';
import { ApiClient } from '@/utils/ApiClient';

/**
 * لوحة التحكم الإدارية - Playground Editor
 */
export class AdminDashboard {
    private container: HTMLElement;
    private router: Router;
    private engine: any;
    private scene: any;
    private canvas: HTMLCanvasElement | null = null;
    private editor: any;
    private apiClient: ApiClient;
    private isWebGPUEnabled: boolean = false;

    constructor(container: HTMLElement, router: Router) {
        this.container = container;
        this.router = router;
        this.apiClient = new ApiClient();
    }

    /**
     * تهيئة لوحة التحكم الإدارية
     */
    async initialize(): Promise<void> {
        this.createHTML();
        await this.initializeEditor();
        await this.initializeBabylon();
        this.setupEventListeners();
        
        // تحميل الكود الافتراضي في المحرر إذا كان فارغًا
        if (this.editor && !this.editor.getValue().trim()) {
            this.editor.setValue(this.getDefaultCode());
        }
        
        // تشغيل الكود الموجود في المحرر تلقائيًا عند التحميل الأولي إذا كان يحتوي على كود
        if (this.editor && this.editor.getValue().trim()) {
            await this.runCode();
        }
    }

    /**
     * إنشاء HTML للوحة التحكم
     */
    private createHTML(): void {
        this.container.innerHTML = this.getHTML();
    }

    /**
     * الحصول على HTML للوحة التحكم
     */
    private getHTML(): string {
        return `
            <div class="admin-dashboard">
                <div class="dashboard-header">
                    <div class="header-left">
                        <button id="back-btn" class="back-btn">
                            <span>←</span>
                            <span>العودة</span>
                        </button>
                        <h2>لوحة التحكم الإدارية</h2>
                    </div>
                    
                    <div class="header-center">
                        <div class="menu-bar">
                            <button class="menu-btn" id="new-btn">جديد</button>
                            <button class="menu-btn" id="save-btn">حفظ</button>
                            <button class="menu-btn" id="load-btn">تحميل</button>
                            <div class="separator"></div>
                            <select id="asset-type" class="asset-selector">
                                <option value="map">خريطة</option>
                                <option value="character">شخصية</option>
                                <option value="object">كائن</option>
                            </select>
                            <button class="menu-btn" id="run-btn">تشغيل</button>
                        </div>
                    </div>
                    
                    <div class="header-right">
                        <select id="engine-selector" class="engine-selector">
                            <option value="webgl2">WebGL2</option>
                            <option value="webgpu">WebGPU</option>
                        </select>
                        <button class="control-btn" id="layout-btn">⚏</button>
                        <button class="control-btn" id="settings-btn">⚙️</button>
                    </div>
                </div>
                
                <div class="dashboard-content">
                    <div class="viewport-container">
                        <div class="viewport-header">
                            <h3>منطقة العرض ثلاثية الأبعاد</h3>
                            <div class="viewport-controls">
                                <button class="viewport-btn" id="wireframe-btn">🔲</button>
                                <button class="viewport-btn" id="inspector-btn">🔍</button>
                                <button class="viewport-btn" id="fullscreen-viewport-btn">⛶</button>
                            </div>
                        </div>
                        <div class="viewport">
                            <canvas id="babylon-canvas"></canvas>
                            <div id="viewport-loading" class="viewport-loading">
                                <div class="loading-spinner"></div>
                                <div>جاري تحميل محرر البيئة...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="editor-container">
                        <div class="editor-header">
                            <h3>محرر الكود</h3>
                            <div class="editor-controls">
                                <button class="editor-btn" id="format-btn">تنسيق</button>
                                <button class="editor-btn" id="validate-btn">تحقق</button>
                                <select id="language-select" class="language-selector">
                                    <option value="javascript">JavaScript</option>
                                    <option value="typescript">TypeScript</option>
                                </select>
                            </div>
                        </div>
                        <div class="editor">
                            <div id="monaco-editor"></div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-footer">
                    <div class="status-bar">
                        <span id="status-text">جاهز</span>
                        <div class="status-right">
                            <span id="cursor-position">السطر 1، العمود 1</span>
                            <span id="engine-info">WebGL2</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .admin-dashboard {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .dashboard-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.5rem 1rem;
                    background: #2d2d30;
                    border-bottom: 1px solid #3e3e42;
                    min-height: 60px;
                }
                
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #0e639c;
                    border: none;
                    border-radius: 4px;
                    color: white;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                
                .back-btn:hover {
                    background: #1177bb;
                }
                
                .header-left h2 {
                    margin: 0;
                    font-size: 1.2rem;
                    font-weight: 600;
                }
                
                .menu-bar {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .menu-btn {
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: 1px solid #3e3e42;
                    border-radius: 4px;
                    color: #d4d4d4;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .menu-btn:hover {
                    background: #3e3e42;
                    border-color: #007acc;
                }
                
                .separator {
                    width: 1px;
                    height: 20px;
                    background: #3e3e42;
                    margin: 0 0.5rem;
                }
                
                .asset-selector, .language-selector, .engine-selector {
                    padding: 0.5rem;
                    background: #3c3c3c;
                    border: 1px solid #3e3e42;
                    border-radius: 4px;
                    color: #d4d4d4;
                    cursor: pointer;
                }
                
                .engine-selector {
                    margin-right: 0.5rem;
                }
                
                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .control-btn {
                    width: 35px;
                    height: 35px;
                    border: none;
                    border-radius: 4px;
                    background: transparent;
                    color: #d4d4d4;
                    cursor: pointer;
                    transition: background 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .control-btn:hover {
                    background: #3e3e42;
                }
                
                .dashboard-content {
                    flex: 1;
                    display: flex;
                    min-height: 0;
                }
                
                .viewport-container, .editor-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }
                
                .viewport-container {
                    border-right: 1px solid #3e3e42;
                }
                
                .viewport-header, .editor-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.5rem 1rem;
                    background: #252526;
                    border-bottom: 1px solid #3e3e42;
                    min-height: 40px;
                }
                
                .viewport-header h3, .editor-header h3 {
                    margin: 0;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                
                .viewport-controls, .editor-controls {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                
                .viewport-btn, .editor-btn {
                    width: 30px;
                    height: 30px;
                    border: none;
                    border-radius: 3px;
                    background: transparent;
                    color: #d4d4d4;
                    cursor: pointer;
                    transition: background 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                }
                
                .editor-btn {
                    width: auto;
                    padding: 0.3rem 0.8rem;
                    font-size: 0.8rem;
                }
                
                .viewport-btn:hover, .editor-btn:hover {
                    background: #3e3e42;
                }
                
                .viewport, .editor {
                    flex: 1;
                    position: relative;
                    min-height: 0;
                }
                
                #babylon-canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                    background: #1a1a1a;
                }
                
                #monaco-editor {
                    width: 100%;
                    height: 100%;
                }
                
                .viewport-loading {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(30, 30, 30, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                }
                
                .loading-spinner {
                    width: 30px;
                    height: 30px;
                    border: 2px solid rgba(212, 212, 212, 0.3);
                    border-top: 2px solid #007acc;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .dashboard-footer {
                    background: #007acc;
                    color: white;
                    padding: 0.3rem 1rem;
                    font-size: 0.8rem;
                }
                
                .status-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .status-right {
                    display: flex;
                    gap: 1rem;
                }
                
                @media (max-width: 1024px) {
                    .dashboard-content {
                        flex-direction: column;
                    }
                    
                    .viewport-container {
                        border-right: none;
                        border-bottom: 1px solid #3e3e42;
                        height: 50%;
                    }
                    
                    .editor-container {
                        height: 50%;
                    }
                }
                
                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        min-height: auto;
                    }
                    
                    .header-center {
                        order: -1;
                        width: 100%;
                    }
                    
                    .menu-bar {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    
                    .menu-btn {
                        padding: 0.4rem 0.8rem;
                        font-size: 0.8rem;
                    }
                }
            </style>
        `;
    }

    /**
     * ربط مستمعي الأحداث
     */
    private setupEventListeners(): void {
        const backBtn = document.getElementById('back-btn');
        const newBtn = document.getElementById('new-btn');
        const saveBtn = document.getElementById('save-btn');
        const loadBtn = document.getElementById('load-btn');
        const runBtn = document.getElementById('run-btn');
        const engineSelector = document.getElementById('engine-selector') as HTMLSelectElement;

        backBtn?.addEventListener('click', () => {
            this.cleanup();
            this.router.navigate('/');
        });

        newBtn?.addEventListener('click', () => this.newProject());
        saveBtn?.addEventListener('click', () => this.saveProject());
        loadBtn?.addEventListener('click', () => this.loadProject());
        runBtn?.addEventListener('click', () => this.runCode());
        
        engineSelector?.addEventListener('change', () => this.switchEngine());
    }

    /**
     * تهيئة محرر Monaco
     */
    private async initializeEditor(): Promise<void> {
        try {
            const monaco = await import('monaco-editor');
            const editorElement = document.getElementById("monaco-editor");
            if (!editorElement) return;

            this.editor = monaco.editor.create(editorElement as HTMLElement, {
                value: "",
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                cursorStyle: 'line',
                wordWrap: 'on'
            });

            // تحديث موضع المؤشر
            this.editor.onDidChangeCursorPosition((e: any) => {
                const position = document.getElementById('cursor-position');
                if (position) {
                    position.textContent = `السطر ${e.position.lineNumber}، العمود ${e.position.column}`;
                }
            });

        } catch (error) {
            console.error("Failed to initialize Monaco editor:", error);
        }
    }

    /**
     * تهيئة محرك Babylon.js
     */
    private async initializeBabylon(): Promise<void> {
        try {
            // استيراد Babylon.js بشكل مودولي
            const [
                { Engine },
                { WebGPUEngine },
                { Scene },
                { Color3 }
            ] = await Promise.all([
                import('@babylonjs/core/Engines/engine'),
                import('@babylonjs/core/Engines/webgpuEngine'),
                import('@babylonjs/core/scene'),
                import('@babylonjs/core/Maths/math.color')
            ]);

            this.canvas = document.getElementById('babylon-canvas') as HTMLCanvasElement;
            if (!this.canvas) return;

            // تحديد نوع المحرك بناءً على الاختيار
            const engineSelector = document.getElementById('engine-selector') as HTMLSelectElement;
            const selectedEngine = engineSelector?.value || 'webgl2';

            if (selectedEngine === 'webgpu' && await WebGPUEngine.IsSupportedAsync) {
                // إنشاء محرك WebGPU
                this.engine = new WebGPUEngine(this.canvas, {
                    antialias: true,
                    stencil: true,
                    preserveDrawingBuffer: true
                });
                await this.engine.initAsync();
                this.isWebGPUEnabled = true;
            } else {
                // إنشاء محرك WebGL2
                this.engine = new Engine(this.canvas, true, {
                    preserveDrawingBuffer: true,
                    stencil: true,
                    antialias: true
                });
                this.isWebGPUEnabled = false;
            }

            // إنشاء مشهد فارغ
            this.scene = new Scene(this.engine);
            this.scene.clearColor = new Color3(0.1, 0.1, 0.1);

            // بدء حلقة العرض
            this.engine.runRenderLoop(() => {
                if (this.scene) {
                    this.scene.render();
                }
            });

            // التعامل مع تغيير حجم النافذة
            window.addEventListener('resize', () => {
                this.engine?.resize();
            });

            // إخفاء شاشة التحميل
            const loadingElement = document.getElementById('viewport-loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // تحديث معلومات المحرك
            this.updateEngineInfo();

        } catch (error) {
            console.error('Failed to initialize Babylon.js:', error);
        }
    }

    /**
     * تحديث معلومات المحرك
     */
    private updateEngineInfo(): void {
        const engineInfo = document.getElementById('engine-info');
        if (engineInfo) {
            if (this.isWebGPUEnabled) {
                engineInfo.textContent = 'WebGPU';
            } else {
                engineInfo.textContent = this.engine?.webGLVersion > 1 ? 'WebGL2' : 'WebGL';
            }
        }
    }

    /**
     * تبديل محرك العرض
     */
    private async switchEngine(): Promise<void> {
        const engineSelector = document.getElementById('engine-selector') as HTMLSelectElement;
        const selectedEngine = engineSelector?.value || 'webgl2';
        
        try {
            // تنظيف المحرك الحالي
            if (this.engine) {
                this.engine.dispose();
            }

            // إعادة تهيئة المحرك الجديد
            await this.initializeBabylon();
            
            // إعادة تشغيل الكود الحالي إذا كان موجودًا
            if (this.editor && this.editor.getValue().trim()) {
                await this.runCode();
            }

            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = `تم التبديل إلى ${selectedEngine === 'webgpu' ? 'WebGPU' : 'WebGL2'}`;
            }

        } catch (error) {
            console.error('Error switching engine:', error);
            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = `خطأ في تبديل المحرك: ${error.message}`;
            }
        }
    }

    /**
     * تشغيل الكود
     */
    private async runCode(): Promise<void> {
        if (!this.editor || !this.scene || !this.engine) return;

        try {
            const code = this.editor.getValue();
            if (!code.trim()) return;

            // تنظيف المشهد الحالي
            this.scene.dispose();
            
            // إنشاء مشهد جديد
            const { Scene } = await import('@babylonjs/core/scene');
            const { Color3 } = await import('@babylonjs/core/Maths/math.color');
            
            this.scene = new Scene(this.engine);
            this.scene.clearColor = new Color3(0.1, 0.1, 0.1);

            // تشغيل الكود
            const createScene = new Function('engine', 'canvas', 'BABYLON', `
                ${code}
                return createScene ? createScene() : null;
            `);

            // استيراد BABYLON للكود المستخدم
            const BABYLON = await import('@babylonjs/core');
            const newScene = createScene(this.engine, this.canvas, BABYLON);
            
            if (newScene) {
                this.scene = newScene;
            }

            // تحديث الحالة
            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = 'تم تشغيل الكود بنجاح';
            }

        } catch (error) {
            console.error('Error running code:', error);
            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = `خطأ: ${error.message}`;
            }
        }
    }

    /**
     * الحصول على الكود الافتراضي
     */
    private getDefaultCode(): string {
        return getDefaultSceneCode();
    }

    /**
     * مشروع جديد
     */
    private newProject(): void {
        if (this.editor) {
            this.editor.setValue(this.getDefaultCode());
        }
    }

    /**
     * حفظ المشروع
     */
    private async saveProject(): Promise<void> {
        if (!this.editor) return;
        
        const code = this.editor.getValue();
        if (!code.trim()) {
            alert('لا يوجد كود للحفظ');
            return;
        }

        // الحصول على نوع الأصل المحدد
        const assetTypeSelect = document.getElementById('asset-type') as HTMLSelectElement;
        const assetType = assetTypeSelect?.value || 'map';

        // طلب اسم الأصل من المستخدم
        const assetName = prompt('أدخل اسم الأصل:');
        if (!assetName) return;

        try {
            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = 'جاري الحفظ...';
            }

            const result = await this.apiClient.saveAsset(
                assetType as 'map' | 'character' | 'object',
                assetName,
                code
            );

            if (result.success) {
                if (statusText) {
                    statusText.textContent = `تم حفظ ${assetType} بنجاح`;
                }
                alert(result.message);
            } else {
                throw new Error(result.error || 'فشل في الحفظ');
            }

        } catch (error) {
            console.error('Error saving project:', error);
            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = `خطأ في الحفظ: ${error.message}`;
            }
            alert(`خطأ في الحفظ: ${error.message}`);
        }
    }

    /**
     * تحميل المشروع
     */
    private async loadProject(): Promise<void> {
        try {
            // الحصول على نوع الأصل المحدد
            const assetTypeSelect = document.getElementById('asset-type') as HTMLSelectElement;
            const assetType = assetTypeSelect?.value || 'map';

            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = 'جاري جلب قائمة الأصول...';
            }

            // جلب قائمة الأصول المتاحة
            const assetsResult = await this.apiClient.listAssets(assetType as 'map' | 'character' | 'object');
            
            if (!assetsResult.success || !assetsResult.assets.length) {
                alert('لا توجد أصول محفوظة من هذا النوع');
                if (statusText) {
                    statusText.textContent = 'جاهز';
                }
                return;
            }

            // إنشاء قائمة للاختيار من بينها
            const assetNames = assetsResult.assets.map((asset: any) => asset.name);
            const selectedAsset = prompt(`اختر الأصل للتحميل:\n${assetNames.join('\n')}\n\nأدخل الاسم:`);
            
            if (!selectedAsset) {
                if (statusText) {
                    statusText.textContent = 'جاهز';
                }
                return;
            }

            if (statusText) {
                statusText.textContent = 'جاري التحميل...';
            }

            // تحميل الأصل المحدد
            const loadResult = await this.apiClient.loadAsset(
                assetType as 'map' | 'character' | 'object',
                selectedAsset
            );

            if (loadResult.success && loadResult.data) {
                if (this.editor) {
                    this.editor.setValue(loadResult.data.code);
                }
                
                if (statusText) {
                    statusText.textContent = `تم تحميل ${assetType} بنجاح`;
                }
                
                alert(`تم تحميل ${selectedAsset} بنجاح`);
            } else {
                throw new Error(loadResult.error || 'فشل في التحميل');
            }

        } catch (error) {
            console.error('Error loading project:', error);
            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = `خطأ في التحميل: ${error.message}`;
            }
            alert(`خطأ في التحميل: ${error.message}`);
        }
    }

    /**
     * تنظيف الموارد
     */
    cleanup(): void {
        if (this.engine) {
            this.engine.dispose();
        }
        if (this.editor) {
            this.editor.dispose();
        }
    }
}

