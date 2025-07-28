/**
 * المشهد الافتراضي - أرضية بسيطة مع كرة
 * يتم استخدامه كمشهد افتراضي في اللعبة والـ playground
 */

export interface SceneComponents {
    Scene: any;
    FreeCamera?: any;
    ArcRotateCamera?: any;
    HemisphericLight: any;
    Vector3: any;
    Color3: any;
    MeshBuilder: any;
    StandardMaterial?: any;
}

/**
 * إنشاء المشهد الافتراضي
 */
export function createDefaultScene(engine: any, canvas: HTMLCanvasElement, components: SceneComponents): any {
    const { Scene, FreeCamera, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder } = components;
    
    // إنشاء المشهد الأساسي
    const scene = new Scene(engine);

    // إنشاء الكاميرا الحرة
    let camera;
    if (FreeCamera) {
        camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(canvas, true);
    } else if (ArcRotateCamera) {
        // استخدام ArcRotateCamera كبديل إذا لم تكن FreeCamera متاحة
        camera = new ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
        camera.attachControls(canvas, true);
    }

    // إنشاء الإضاءة
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // إنشاء الكرة
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.position.y = 1;

    // إنشاء الأرضية
    const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

    return scene;
}

/**
 * الحصول على كود المشهد الافتراضي كنص للـ playground
 */
export function getDefaultSceneCode(): string {
    return `// المشهد الافتراضي - أرضية بسيطة مع كرة
var createScene = function () {
    // إنشاء المشهد الأساسي (غير شبكي)
    var scene = new BABYLON.Scene(engine);

    // إنشاء وتموضع الكاميرا الحرة (غير شبكية)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // توجيه الكاميرا نحو مركز المشهد
    camera.setTarget(BABYLON.Vector3.Zero());

    // ربط الكاميرا بالـ canvas
    camera.attachControl(canvas, true);

    // إنشاء الإضاءة، موجهة نحو 0,1,0 - نحو السماء (غير شبكية)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // الشدة الافتراضية هي 1. دعنا نخفف الإضاءة قليلاً
    light.intensity = 0.7;

    // الشكل المدمج 'كرة'
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

    // رفع الكرة لأعلى بنصف ارتفاعها
    sphere.position.y = 1;

    // الشكل المدمج 'أرضية'
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

    return scene;
};

// إنشاء المشهد
var scene = createScene();

// تشغيل حلقة الرسم
engine.runRenderLoop(function () {
    scene.render();
});`;
}

