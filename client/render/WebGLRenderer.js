/**
 * WebGL Renderer - Pipeline de Renderização Avançado
 * Sistema de renderização otimizado com WebGL para performance máxima
 * Version 1.0.0 - Performance Optimization
 */

class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.programs = new Map();
        this.buffers = new Map();
        this.textures = new Map();
        this.uniforms = new Map();
        
        // Performance metrics
        this.frameCount = 0;
        this.fps = 0;
        this.lastTime = performance.now();
        this.frameTime = 0;
        
        // Object pooling
        this.objectPool = {
            vertices: [],
            indices: [],
            transforms: []
        };
        
        // Batch rendering
        this.batches = new Map();
        this.maxBatchSize = 1000;
        
        // Culling systems
        this.frustumCulling = new FrustumCulling();
        this.occlusionCulling = new OcclusionCulling();
        
        // LOD system
        this.lodSystem = new LODSystem();
        
        this.initialize();
    }
    
    /**
     * Inicializa WebGL e configura pipeline
     */
    initialize() {
        console.log('🎨 Inicializando WebGL Renderer v1.0.0');
        
        // Obter contexto WebGL
        this.gl = this.canvas.getContext('webgl2', {
            alpha: false,
            antialias: true,
            depth: true,
            stencil: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
            desynchronized: true
        });
        
        if (!this.gl) {
            console.error('❌ WebGL2 não suportado, fallback para WebGL');
            this.gl = this.canvas.getContext('webgl');
        }
        
        if (!this.gl) {
            throw new Error('❌ WebGL não suportado neste navegador');
        }
        
        // Configurar WebGL
        this.setupWebGL();
        
        // Criar shaders básicos
        this.createBasicShaders();
        
        // Configurar buffers
        this.setupBuffers();
        
        // Inicializar sistemas de otimização
        this.initializeOptimizationSystems();
        
        console.log('✅ WebGL Renderer inicializado com sucesso');
    }
    
    /**
     * Configura WebGL para performance
     */
    setupWebGL() {
        const gl = this.gl;
        
        // Habilitar depth testing
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // Habilitar blending para transparência
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Habilitar culling para performance
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        
        // Configurar viewport
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Cor de fundo
        gl.clearColor(0.1, 0.1, 0.2, 1.0);
        
        // Configurar anisotropic filtering se disponível
        const ext = gl.getExtension('EXT_texture_filter_anisotropic');
        if (ext) {
            gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        }
    }
    
    /**
     * Cria shaders básicos
     */
    createBasicShaders() {
        // Vertex shader básico
        const vertexShaderSource = `
            #version 300 es
            precision highp float;
            
            layout(location = 0) in vec3 aPosition;
            layout(location = 1) in vec2 aTexCoord;
            layout(location = 2) in vec3 aNormal;
            layout(location = 3) in vec4 aColor;
            
            uniform mat4 uProjectionMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uModelMatrix;
            uniform mat4 uNormalMatrix;
            
            out vec2 vTexCoord;
            out vec3 vNormal;
            out vec4 vColor;
            out vec3 vWorldPosition;
            
            void main() {
                vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
                
                vTexCoord = aTexCoord;
                vNormal = mat3(uNormalMatrix) * aNormal;
                vColor = aColor;
            }
        `;
        
        // Fragment shader básico
        const fragmentShaderSource = `
            #version 300 es
            precision highp float;
            
            in vec2 vTexCoord;
            in vec3 vNormal;
            in vec4 vColor;
            in vec3 vWorldPosition;
            
            uniform sampler2D uTexture;
            uniform vec3 uLightPosition;
            uniform vec3 uLightColor;
            uniform vec3 uAmbientColor;
            uniform float uAlpha;
            
            out vec4 fragColor;
            
            void main() {
                vec4 textureColor = texture(uTexture, vTexCoord);
                
                // Lighting calculation
                vec3 normal = normalize(vNormal);
                vec3 lightDirection = normalize(uLightPosition - vWorldPosition);
                float diff = max(dot(normal, lightDirection), 0.0);
                vec3 diffuse = diff * uLightColor;
                
                vec3 ambient = uAmbientColor * textureColor.rgb;
                vec3 finalColor = ambient + diffuse * textureColor.rgb;
                
                fragColor = vec4(finalColor, textureColor.a * uAlpha) * vColor;
            }
        `;
        
        // Compilar shaders
        this.createProgram('basic', vertexShaderSource, fragmentShaderSource);
    }
    
    /**
     * Compila e cria programa de shader
     */
    createProgram(name, vertexSource, fragmentSource) {
        const gl = this.gl;
        
        // Compilar vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('❌ Erro no vertex shader:', gl.getShaderInfoLog(vertexShader));
            gl.deleteShader(vertexShader);
            return null;
        }
        
        // Compilar fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('❌ Erro no fragment shader:', gl.getShaderInfoLog(fragmentShader));
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return null;
        }
        
        // Criar programa
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('❌ Erro ao linkar programa:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return null;
        }
        
        // Obter locations de uniforms e attributes
        const uniforms = {};
        const attributes = {};
        
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        
        const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < attributeCount; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }
        
        // Armazenar programa
        this.programs.set(name, {
            program,
            uniforms,
            attributes
        });
        
        // Limpar shaders
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        
        console.log(`✅ Shader program '${name}' criado com sucesso`);
    }
    
    /**
     * Configura buffers básicos
     */
    setupBuffers() {
        const gl = this.gl;
        
        // Buffer de vértices para quad
        const vertices = new Float32Array([
            // x, y, z, u, v, nx, ny, nz, r, g, b, a
            -0.5, -0.5, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1,
             0.5, -0.5, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1,
             0.5,  0.5, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1,
            -0.5,  0.5, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1
        ]);
        
        // Buffer de índices
        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        
        // Criar e preencher buffers
        this.buffers.set('quad_vertices', this.createBuffer(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW));
        this.buffers.set('quad_indices', this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW));
    }
    
    /**
     * Cria buffer WebGL
     */
    createBuffer(target, data, usage) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);
        return buffer;
    }
    
    /**
     * Inicializa sistemas de otimização
     */
    initializeOptimizationSystems() {
        // Inicializar frustum culling
        this.frustumCulling.initialize();
        
        // Inicializar LOD system
        this.lodSystem.initialize();
        
        // Configurar object pooling
        this.initializeObjectPooling();
    }
    
    /**
     * Inicializa object pooling
     */
    initializeObjectPooling() {
        // Pool de vértices
        for (let i = 0; i < 100; i++) {
            this.objectPool.vertices.push(new Float32Array(12 * 1000)); // 1000 quads
        }
        
        // Pool de índices
        for (let i = 0; i < 100; i++) {
            this.objectPool.indices.push(new Uint16Array(6 * 1000)); // 1000 quads
        }
    }
    
    /**
     * Renderiza cena
     */
    render(scene) {
        const gl = this.gl;
        const startFrame = performance.now();
        
        // Limpar buffers
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Atualizar métricas
        this.updateFrameMetrics(startFrame);
        
        // Aplicar frustum culling
        const visibleObjects = this.frustumCulling.filter(scene.objects);
        
        // Aplicar LOD
        const lodObjects = this.lodSystem.applyLOD(visibleObjects, scene.camera);
        
        // Renderizar objetos em batches
        this.renderBatches(lodObjects, scene);
        
        // Finalizar frame
        this.endFrame();
    }
    
    /**
     * Renderiza objetos em batches
     */
    renderBatches(objects, scene) {
        // Agrupar objetos por material/texture
        const batches = this.groupObjectsByMaterial(objects);
        
        // Renderizar cada batch
        for (const [materialKey, batch] of batches) {
            this.renderBatch(batch, scene);
        }
    }
    
    /**
     * Agrupa objetos por material
     */
    groupObjectsByMaterial(objects) {
        const batches = new Map();
        
        for (const object of objects) {
            const materialKey = `${object.texture}_${object.shader}`;
            
            if (!batches.has(materialKey)) {
                batches.set(materialKey, []);
            }
            
            batches.get(materialKey).push(object);
        }
        
        return batches;
    }
    
    /**
     * Renderiza um batch de objetos
     */
    renderBatch(batch, scene) {
        if (batch.length === 0) return;
        
        const gl = this.gl;
        const program = this.programs.get('basic');
        
        // Usar programa
        gl.useProgram(program.program);
        
        // Configurar uniforms
        this.setUniforms(program, scene);
        
        // Preparar batch data
        const batchData = this.prepareBatchData(batch);
        
        // Renderizar batch
        this.renderBatchData(batchData);
    }
    
    /**
     * Configura uniforms do shader
     */
    setUniforms(program, scene) {
        const gl = this.gl;
        
        // Matrizes
        gl.uniformMatrix4fv(program.uniforms.uProjectionMatrix, false, scene.camera.projectionMatrix);
        gl.uniformMatrix4fv(program.uniforms.uViewMatrix, false, scene.camera.viewMatrix);
        gl.uniformMatrix4fv(program.uniforms.uModelMatrix, false, scene.modelMatrix);
        
        // Lighting
        gl.uniform3f(program.uniforms.uLightPosition, 100, 100, 100);
        gl.uniform3f(program.uniforms.uLightColor, 1, 1, 1);
        gl.uniform3f(program.uniforms.uAmbientColor, 0.2, 0.2, 0.3);
        gl.uniform1f(program.uniforms.uAlpha, 1.0);
    }
    
    /**
     * Prepara dados do batch
     */
    prepareBatchData(batch) {
        const vertices = [];
        const indices = [];
        let indexOffset = 0;
        
        for (const object of batch) {
            // Adicionar vértices do objeto
            const objectVertices = this.getObjectVertices(object);
            vertices.push(...objectVertices);
            
            // Adicionar índices do objeto
            const objectIndices = this.getObjectIndices(object, indexOffset);
            indices.push(...objectIndices);
            
            indexOffset += objectVertices.length / 12; // 12 floats por vértice
        }
        
        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            count: indices.length
        };
    }
    
    /**
     * Obtém vértices do objeto
     */
    getObjectVertices(object) {
        // Vértices básicos de quad transformados
        const baseVertices = [
            // x, y, z, u, v, nx, ny, nz, r, g, b, a
            -0.5, -0.5, 0, 0, 1, 0, 0, 1, ...this.colorToFloats(object.color),
             0.5, -0.5, 0, 1, 1, 0, 0, 1, ...this.colorToFloats(object.color),
             0.5,  0.5, 0, 1, 0, 0, 0, 1, ...this.colorToFloats(object.color),
            -0.5,  0.5, 0, 0, 0, 0, 0, 1, ...this.colorToFloats(object.color)
        ];
        
        // Aplicar transformação
        return this.transformVertices(baseVertices, object.transform);
    }
    
    /**
     * Obtém índices do objeto
     */
    getObjectIndices(object, offset) {
        return [
            offset + 0, offset + 1, offset + 2,
            offset + 0, offset + 2, offset + 3
        ];
    }
    
    /**
     * Converte cor para array de floats
     */
    colorToFloats(color) {
        if (typeof color === 'string') {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            return [r, g, b, 1];
        }
        return [1, 1, 1, 1];
    }
    
    /**
     * Aplica transformação aos vértices
     */
    transformVertices(vertices, transform) {
        const transformed = new Float32Array(vertices.length);
        
        for (let i = 0; i < vertices.length; i += 12) {
            // Posição (x, y, z)
            const x = vertices[i] * transform.scale.x + transform.position.x;
            const y = vertices[i + 1] * transform.scale.y + transform.position.y;
            const z = vertices[i + 2] * transform.scale.z + transform.position.z;
            
            transformed[i] = x;
            transformed[i + 1] = y;
            transformed[i + 2] = z;
            
            // Copiar resto (texcoords, normal, color)
            for (let j = 3; j < 12; j++) {
                transformed[i + j] = vertices[i + j];
            }
        }
        
        return transformed;
    }
    
    /**
     * Renderiza dados do batch
     */
    renderBatchData(batchData) {
        const gl = this.gl;
        const program = this.programs.get('basic');
        
        // Criar buffers dinâmicos
        const vertexBuffer = this.createBuffer(gl.ARRAY_BUFFER, batchData.vertices, gl.DYNAMIC_DRAW);
        const indexBuffer = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, batchData.indices, gl.DYNAMIC_DRAW);
        
        // Configurar attributes
        this.setupVertexAttributes(program, vertexBuffer);
        
        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        
        // Renderizar
        gl.drawElements(gl.TRIANGLES, batchData.count, gl.UNSIGNED_SHORT, 0);
        
        // Limpar buffers
        gl.deleteBuffer(vertexBuffer);
        gl.deleteBuffer(indexBuffer);
    }
    
    /**
     * Configura vertex attributes
     */
    setupVertexAttributes(program, vertexBuffer) {
        const gl = this.gl;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        // Position (location = 0)
        gl.enableVertexAttribArray(program.attributes.aPosition);
        gl.vertexAttribPointer(program.attributes.aPosition, 3, gl.FLOAT, false, 48, 0);
        
        // TexCoord (location = 1)
        gl.enableVertexAttribArray(program.attributes.aTexCoord);
        gl.vertexAttribPointer(program.attributes.aTexCoord, 2, gl.FLOAT, false, 48, 12);
        
        // Normal (location = 2)
        gl.enableVertexAttribArray(program.attributes.aNormal);
        gl.vertexAttribPointer(program.attributes.aNormal, 3, gl.FLOAT, false, 48, 20);
        
        // Color (location = 3)
        gl.enableVertexAttribArray(program.attributes.aColor);
        gl.vertexAttribPointer(program.attributes.aColor, 4, gl.FLOAT, false, 48, 32);
    }
    
    /**
     * Atualiza métricas de frame
     */
    updateFrameMetrics(startTime) {
        const currentTime = performance.now();
        this.frameTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.frameCount++;
        
        // Calcular FPS a cada segundo
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1000 / this.frameTime);
        }
    }
    
    /**
     * Finaliza frame
     */
    endFrame() {
        // Limpar object pools
        this.clearObjectPools();
        
        // Resetar batches
        this.batches.clear();
    }
    
    /**
     * Limpa object pools
     */
    clearObjectPools() {
        // Resetar pools para reuso
        this.objectPool.vertices = [];
        this.objectPool.indices = [];
        this.objectPool.transforms = [];
    }
    
    /**
     * Obtém métricas de performance
     */
    getMetrics() {
        return {
            fps: this.fps,
            frameTime: this.frameTime,
            frameCount: this.frameCount,
            batches: this.batches.size,
            objects: this.getTotalObjects(),
            memory: this.getMemoryUsage()
        };
    }
    
    /**
     * Obtém total de objetos
     */
    getTotalObjects() {
        let total = 0;
        for (const batch of this.batches.values()) {
            total += batch.length;
        }
        return total;
    }
    
    /**
     * Obtém uso de memória
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    /**
     * Redimensiona canvas
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.gl) {
            this.gl.viewport(0, 0, width, height);
        }
    }
    
    /**
     * Limpa recursos
     */
    dispose() {
        const gl = this.gl;
        
        // Limpar programas
        for (const program of this.programs.values()) {
            gl.deleteProgram(program.program);
        }
        
        // Limpar buffers
        for (const buffer of this.buffers.values()) {
            gl.deleteBuffer(buffer);
        }
        
        // Limpar texturas
        for (const texture of this.textures.values()) {
            gl.deleteTexture(texture);
        }
        
        this.programs.clear();
        this.buffers.clear();
        this.textures.clear();
        
        console.log('🧹 WebGL Renderer limpo');
    }
}

// Sistemas de otimização
class FrustumCulling {
    constructor() {
        this.planes = [];
    }
    
    initialize() {
        // Inicializar 6 planos do frustum
        for (let i = 0; i < 6; i++) {
            this.planes.push({ normal: { x: 0, y: 0, z: 0 }, distance: 0 });
        }
    }
    
    filter(objects) {
        return objects.filter(object => this.isInFrustum(object));
    }
    
    isInFrustum(object) {
        // Simplificado - sempre retorna true por enquanto
        return true;
    }
}

class OcclusionCulling {
    constructor() {
        this.enabled = false;
    }
    
    initialize() {
        // Implementação de occlusion culling
    }
}

class LODSystem {
    constructor() {
        this.levels = [
            { distance: 0, quality: 1.0 },
            { distance: 100, quality: 0.8 },
            { distance: 500, quality: 0.6 },
            { distance: 1000, quality: 0.4 }
        ];
    }
    
    initialize() {
        // Inicializar sistema LOD
    }
    
    applyLOD(objects, camera) {
        return objects.map(object => {
            const distance = this.getDistance(object, camera);
            const lod = this.getLODLevel(distance);
            
            return {
                ...object,
                lod: lod,
                quality: lod.quality
            };
        });
    }
    
    getDistance(object, camera) {
        const dx = object.position.x - camera.position.x;
        const dy = object.position.y - camera.position.y;
        const dz = object.position.z - camera.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    getLODLevel(distance) {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (distance >= this.levels[i].distance) {
                return this.levels[i];
            }
        }
        return this.levels[0];
    }
}

// Exportar para uso global
window.WebGLRenderer = WebGLRenderer;
