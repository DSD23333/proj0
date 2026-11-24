import Reveal from 'reveal.js';

import 'reveal.js/reveal.css';
import 'reveal.js/theme/white.css';

import 'reveal.js/plugin/highlight/monokai.css';
import RevealHighlight from 'reveal.js/plugin/highlight';

// 加载基础样式
import './styles/base.css';

// 自动加载所有章节样式
import.meta.glob('./styles/slides/*.css', {
    eager: true,
});

// 获取幻灯片容器
const slides = document.querySelector('#slides');

// 自动加载 slides 目录下的 HTML 文件
const modules = import.meta.glob('./slides/*.html', {
    query: '?raw',
    import: 'default',
    eager: true,
});

// NOTE: 按文件名排序并插入
const slideFiles = Object.keys(modules).sort();

// Vite 会根据 base 自动提供部署路径
const BASE_URL = import.meta.env.BASE_URL;

// 修正 public 资源路径
function fixAssetPaths(html) {
    const template = document.createElement('template');
    template.innerHTML = html;

    // 处理 HTML 资源属性
    const selectors = [
        'img[src]',
        'video[src]',
        'video[poster]',
        'audio[src]',
        'source[src]',
    ];

    template.content.querySelectorAll(selectors.join(',')).forEach(el => {
        for (const attr of ['src', 'poster']) {
            const value = el.getAttribute(attr);

            if (value && value.startsWith('/') && !value.startsWith('//')) {
                el.setAttribute(
                    attr,
                    BASE_URL + value.replace(/^\/+/, '')
                );
            }
        }
    });

    // 处理 HTML 内联 style 中的 url()
    template.content.querySelectorAll('[style]').forEach(el => {
        const style = el.getAttribute('style');

        const fixedStyle = style.replace(
            /url\(\s*(['"]?)\/(?!\/)([^'")]+)\1\s*\)/g,
            (_, quote, path) => `url(${quote}${BASE_URL}${path}${quote})`
        );

        el.setAttribute('style', fixedStyle);
    });

    return template.innerHTML;
}

// 插入幻灯片
for (const file of slideFiles) {
    slides.insertAdjacentHTML(
        'beforeend',
        fixAssetPaths(modules[file])
    );
}

// 初始化 Reveal.js
const deck = new Reveal({
    width: 1280,
    height: 720,
    hash: true,
    slideNumber: true,
    controls: true,
    progress: true,
    center: true,
    transition: 'fade',
    transitionSpeed: 'slow',

    plugins: [RevealHighlight],
});

// 视频控制
function handleVideoPage(slide) {
    if (!slide) return;

    document.querySelectorAll('.ppt-video').forEach(video => {
        if (slide.contains(video)) {
            video.playbackRate = Number(video.dataset.speed) || 1;

            // 从头播放
            if (video.readyState >= 1) {
                video.currentTime = 0;
            } else {
                video.addEventListener('loadedmetadata', () => {
                    video.currentTime = 0;
                }, { once: true });
            }

            video.play().catch(error => {
                console.error('Video play failed:', error);
            });

        } else {
            video.pause();
        }
    });
}

// 注意：先注册事件，再初始化
deck.on('ready', event => {
    handleVideoPage(event.currentSlide);
});

deck.on('slidechanged', event => {
    handleVideoPage(event.currentSlide);
});


deck.initialize();
