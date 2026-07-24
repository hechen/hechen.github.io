(function () {
  "use strict";

  const canvas = document.getElementById("home-water-canvas");
  if (!canvas) return;

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
  });

  if (!gl) {
    canvas.classList.add("is-fallback");
    return;
  }

  const vertexSource = `#version 300 es
    in vec2 a_position;
    out vec2 v_uv;

    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;

    in vec2 v_uv;
    out vec4 outColor;

    uniform float u_time;
    uniform float u_rippleAge;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform vec2 u_ripple;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    mat3 cameraBasis(vec3 origin, vec3 target) {
      vec3 forward = normalize(target - origin);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = normalize(cross(right, forward));
      return mat3(right, up, forward);
    }

    float waterHeight(vec2 point, float time, vec2 ripplePoint) {
      float height = sin(dot(point, normalize(vec2(0.8, 0.6))) * 1.65 + time * 0.82) * 0.125;
      height += sin(dot(point, normalize(vec2(-0.42, 0.91))) * 2.35 - time * 1.06) * 0.072;
      height += sin(dot(point, normalize(vec2(0.2, 0.98))) * 4.8 + time * 1.46) * 0.025;
      height += sin(length(point + vec2(2.8, -1.4)) * 2.1 - time * 0.72) * 0.034;

      if (u_rippleAge < 6.0) {
        float distanceFromTouch = length(point - ripplePoint);
        float envelope = exp(-distanceFromTouch * 0.74) * exp(-u_rippleAge * 0.42);
        height += sin(distanceFromTouch * 10.5 - u_rippleAge * 5.8) * envelope * 0.17;
      }

      return height;
    }

    vec3 skyColor(vec3 direction) {
      float horizon = pow(1.0 - abs(direction.y), 3.0);
      float upper = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
      vec3 color = mix(vec3(0.006, 0.026, 0.041), vec3(0.035, 0.15, 0.20), horizon);
      color = mix(color, vec3(0.015, 0.055, 0.075), upper * 0.65);

      vec3 sunDirection = normalize(vec3(-0.45, 0.24, -0.86));
      float sun = pow(max(dot(direction, sunDirection), 0.0), 520.0);
      float glow = pow(max(dot(direction, sunDirection), 0.0), 16.0);
      color += vec3(0.91, 1.0, 0.88) * sun * 2.3;
      color += vec3(0.13, 0.58, 0.61) * glow * 0.16;
      return color;
    }

    void main() {
      vec2 centered = v_uv * 2.0 - 1.0;
      centered.x *= u_resolution.x / max(u_resolution.y, 1.0);

      float yaw = (u_mouse.x - 0.5) * 0.82;
      float elevation = mix(1.25, 2.75, u_mouse.y);
      vec3 origin = vec3(sin(yaw) * 4.65, elevation, cos(yaw) * 4.65);
      vec3 target = vec3(0.0, -0.08, 0.0);
      mat3 basis = cameraBasis(origin, target);
      vec3 ray = basis * normalize(vec3(centered, 1.82));

      vec2 pointerScreen = u_ripple * 2.0 - 1.0;
      pointerScreen.x *= u_resolution.x / max(u_resolution.y, 1.0);
      vec3 pointerRay = basis * normalize(vec3(pointerScreen, 1.82));
      float pointerDistance = -origin.y / min(pointerRay.y, -0.02);
      vec2 ripplePoint = (origin + pointerRay * pointerDistance).xz;

      vec3 color;
      if (ray.y > -0.015) {
        color = skyColor(ray);
      } else {
        float travel = -origin.y / ray.y;
        vec3 point = origin + ray * travel;

        for (int index = 0; index < 5; index++) {
          float height = waterHeight(point.xz, u_time, ripplePoint);
          travel -= (point.y - height) / ray.y;
          point = origin + ray * travel;
        }

        float epsilon = 0.025;
        float height = waterHeight(point.xz, u_time, ripplePoint);
        float heightX = waterHeight(point.xz + vec2(epsilon, 0.0), u_time, ripplePoint);
        float heightZ = waterHeight(point.xz + vec2(0.0, epsilon), u_time, ripplePoint);
        vec3 normal = normalize(vec3(height - heightX, epsilon, height - heightZ));

        vec3 reflectionDirection = reflect(ray, normal);
        vec3 reflection = skyColor(reflectionDirection);
        float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(-ray, normal), 0.0), 4.5);

        float depthTone = clamp(length(point.xz) / 8.0, 0.0, 1.0);
        vec3 body = mix(vec3(0.003, 0.075, 0.083), vec3(0.006, 0.027, 0.045), depthTone);
        body += vec3(0.0, 0.075, 0.07) * max(normal.y - 0.87, 0.0);

        vec3 lightDirection = normalize(vec3(-0.45, 0.72, -0.86));
        vec3 halfVector = normalize(lightDirection - ray);
        float specular = pow(max(dot(normal, halfVector), 0.0), 145.0);
        float glitter = pow(max(dot(normal, halfVector), 0.0), 820.0);
        glitter *= step(0.72, hash21(floor(point.xz * 32.0) + floor(u_time * 2.0)));

        float crest = smoothstep(0.13, 0.22, height);
        color = mix(body, reflection, 0.34 + fresnel * 0.62);
        color += vec3(0.34, 0.92, 0.87) * crest * 0.055;
        color += vec3(0.58, 1.0, 0.92) * specular * 0.72;
        color += vec3(1.0, 1.0, 0.9) * glitter * 1.5;

        float fog = 1.0 - exp(-travel * 0.028);
        color = mix(color, skyColor(ray), fog);
      }

      float vignette = 1.0 - smoothstep(0.45, 1.42, length(centered * vec2(0.62, 0.84)));
      color *= mix(0.68, 1.0, vignette);
      color = pow(color, vec3(0.88));
      outColor = vec4(color, 1.0);
    }
  `;

  function makeShader(type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Water shader:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = makeShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = makeShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    canvas.classList.add("is-fallback");
    return;
  }

  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Water program:", gl.getProgramInfoLog(program));
    canvas.classList.add("is-fallback");
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);

  const uniforms = {
    time: gl.getUniformLocation(program, "u_time"),
    resolution: gl.getUniformLocation(program, "u_resolution"),
    mouse: gl.getUniformLocation(program, "u_mouse"),
    ripple: gl.getUniformLocation(program, "u_ripple"),
    rippleAge: gl.getUniformLocation(program, "u_rippleAge"),
  };

  const targetMouse = { x: 0.5, y: 0.56 };
  const smoothMouse = { x: 0.5, y: 0.56 };
  const ripple = { x: 0.5, y: 0.5 };
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const toggle = document.getElementById("home-motion-toggle");
  const toggleLabel = toggle && toggle.querySelector(".home-motion-label");
  let paused = motionQuery.matches;
  let rippleStartedAt = -100;
  let simulationTime = 0;
  let previousFrame = performance.now();
  let animationFrame = 0;
  let heroVisible = true;

  function syncToggle() {
    if (!toggle || !toggleLabel) return;
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.setAttribute("aria-label", paused ? "Resume water motion" : "Pause water motion");
    toggle.classList.toggle("is-paused", paused);
    toggleLabel.textContent = paused ? "Resume motion" : "Pause motion";
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function updatePointer(event) {
    const bounds = canvas.getBoundingClientRect();
    targetMouse.x = (event.clientX - bounds.left) / bounds.width;
    targetMouse.y = 1 - (event.clientY - bounds.top) / bounds.height;
  }

  function handlePointerDown(event) {
    updatePointer(event);
    ripple.x = targetMouse.x;
    ripple.y = targetMouse.y;
    rippleStartedAt = simulationTime;
    canvas.classList.add("is-pressed");
    canvas.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event) {
    canvas.classList.remove("is-pressed");
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function render(now) {
    const delta = Math.min((now - previousFrame) / 1000, 0.05);
    previousFrame = now;

    if (heroVisible && !document.hidden) {
      resize();
      if (!paused) simulationTime += delta;
      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.035;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.035;

      gl.uniform1f(uniforms.time, simulationTime);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.mouse, smoothMouse.x, smoothMouse.y);
      gl.uniform2f(uniforms.ripple, ripple.x, ripple.y);
      gl.uniform1f(uniforms.rippleAge, simulationTime - rippleStartedAt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    animationFrame = window.requestAnimationFrame(render);
  }

  canvas.addEventListener("pointermove", updatePointer);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  window.addEventListener("resize", resize);

  if (toggle) {
    toggle.addEventListener("click", function () {
      paused = !paused;
      syncToggle();
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      heroVisible = entries[0] ? entries[0].isIntersecting : true;
    }, { threshold: 0.01 });
    observer.observe(canvas);
  }

  syncToggle();
  resize();
  animationFrame = window.requestAnimationFrame(render);

  window.addEventListener("pagehide", function () {
    window.cancelAnimationFrame(animationFrame);
  }, { once: true });
})();
