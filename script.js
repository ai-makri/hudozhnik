document.addEventListener('DOMContentLoaded', () => {

  /* --- Lightbox Logic --- */
  const lb = document.getElementById('lb');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');

  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const full = tile.dataset.full;
      // Получаем только текст, убирая лишние пробелы и переносы строк
      const caption = tile.querySelector('figcaption').textContent.trim();
      
      lbImg.src = full;
      lbImg.alt = caption;
      lbCap.textContent = caption;
      
      // Показываем модальное окно
      lb.showModal();
    });
  });

  // ИСПРАВЛЕНИЕ: Закрываем только если клик был по самому диалогу (фону), а не по контенту
  lb.addEventListener('click', (e) => {
    if (e.target === lb) {
      lb.close();
    }
  });

  // ДОБАВЛЕНО: Обработка ошибки загрузки картинки
  lbImg.addEventListener('error', () => {
    lbCap.textContent = 'Ошибка: изображение не найдено. Проверьте имя файла и папку img.';
    lbImg.style.display = 'none';
  });


  /* --- Hero Flow-Field Animation (Canvas) --- */
  const canvas = document.getElementById('flow');
  if (!canvas) return; // Защита, если canvas не найден на странице
  
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  let w, h, particles = , t = 0, mx = .5, my = .4, raf;

  function size() {
    // Увеличиваем разрешение для Retina экранов, чтобы линии были четкими
    const r = devicePixelRatio > 1 ? 1.5 : 1;
    w = canvas.width = canvas.offsetWidth * r;
    h = canvas.height = canvas.offsetHeight * r;
    
    // Количество частиц зависит от площади экрана, но не больше 900
    const particleCount = Math.min(900, Math.floor(w * h / 2600));
    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * w, 
      y: Math.random() * h
    }));
    
    // Очистка фона
    ctx.globalAlpha = 1;
    ctx.fillStyle = cssVar('--bg');
    ctx.fillRect(0, 0, w, h);
  }

  // Математическая функция поля, создающая волны
  const field = (x, y) => Math.sin(x * .0034 + t) + Math.cos(y * .004 - t * .8) + Math.sin((x + y) * .002 + t * .5);

  function step() {
    // Рисуем полупрозрачный слой поверх предыдущего кадра (эффект шлейфа)
    ctx.globalAlpha = .07;
    ctx.fillStyle = cssVar('--bg');
    ctx.fillRect(0, 0, w, h);
    
    ctx.globalAlpha = .75;
    ctx.lineWidth = 1.4;
    
    const cx = mx * w; 
    const cy = my * h;
    
    for (const p of particles) {
      let a = field(p.x, p.y) * 1.3;
      
      // Добавляем притяжение к курсору мыши, если он близко
      const dx = p.x - cx; 
      const dy = p.y - cy; 
      const d = Math.hypot(dx, dy);
      
      if (d < 340) {
        a += Math.atan2(dy, dx) * (1 - d / 340) * 1.2;
      }
      
      const nx = p.x + Math.cos(a) * 2.6;
      const ny = p.y + Math.sin(a) * 2.6;
      
      // Расчет цвета в зависимости от угла и расстояния до мыши
      const hueShift = (a * 40) % 90;
      const finalHue = 260 + (hueShift + 90) % 90 + (d < 340 ? 40 : 0);
      ctx.strokeStyle = `hsl(\${finalHue}, 85%, 60%)`;
      
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      
      p.x = nx; 
      p.y = ny;
      
      // Если частица улетела за край экрана, телепортируем её обратно
      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) { 
        p.x = Math.random() * w; 
        p.y = Math.random() * h; 
      }
    }
    t += .0035;
  }

  function loop() { 
    step(); 
    raf = requestAnimationFrame(loop); 
  }

  size();
  
  // Если пользователь просит уменьшить анимацию, рисуем статичную картинку
  if (reduce) { 
    for (let i = 0; i < 260; i++) step(); 
  } else { 
    loop(); 
  }

  // Обработка изменения размера окна
  let lastW = canvas.offsetWidth;
  addEventListener('resize', () => {
    if (canvas.offsetWidth === lastW) return;
    lastW = canvas.offsetWidth;
    size();
    if (reduce) for (let i = 0; i < 260; i++) step();
  });

  // Отслеживание движения мыши над секцией Hero
  const move = e => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width;
    my = (e.clientY - r.top) / r.height;
  };
  
  // Используем canvas.parentElement, чтобы зона реакции была чуть больше самого канваса
  ['pointermove', 'pointerdown'].forEach(n => canvas.parentElement.addEventListener(n, move));
  
  // Пауза анимации, если вкладка не активна (экономия батареи)
  document.addEventListener('visibilitychange', () => {
    if (reduce) return;
    document.hidden ? cancelAnimationFrame(raf) : loop();
  });
});
