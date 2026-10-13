document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const themeToggle = document.getElementById("themeToggle");

    function applyTheme(theme) {
        root.setAttribute("data-bs-theme", theme);
        try { localStorage.setItem("theme", theme); } catch (e) {}

        if (!themeToggle) return;
        const icon = themeToggle.querySelector("i");
        const isDark = theme === "dark";
        icon.className = isDark ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
        themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }

    applyTheme(root.getAttribute("data-bs-theme") || "light");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            applyTheme(root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
        });
    }

    const nav = document.getElementById("mainNav");
    const navMenu = document.getElementById("navMenu");
    const navIndicator = document.querySelector(".nav-indicator");
    const brand = nav.querySelector(".navbar-brand");

    const items = [...document.querySelectorAll("#navMenu .nav-link")]
        .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
        .filter((item) => item.section);

    let activeLink = null;
    let spyLock = false;
    let lockTimer = null;

    function moveIndicator(link) {
        if (!navIndicator || !link) return;
        if (getComputedStyle(navIndicator).display === "none") return;
        navIndicator.style.width = link.offsetWidth + "px";
        navIndicator.style.transform = "translateX(" + link.offsetLeft + "px)";
        requestAnimationFrame(() => navIndicator.classList.add("ready"));
    }

    function setActive(link) {
        if (!link) return;
        if (link !== activeLink) {
            items.forEach((item) => {
                const isActive = item.link === link;
                item.link.classList.toggle("active", isActive);
                if (isActive) item.link.setAttribute("aria-current", "true");
                else item.link.removeAttribute("aria-current");
            });
            activeLink = link;
        }
        moveIndicator(link);
    }

    function updateSpy() {
        if (!items.length) return;
        const y = window.scrollY + nav.offsetHeight + window.innerHeight * 0.25;
        let current = items[0];
        items.forEach((item) => {
            if (item.section.offsetTop <= y) current = item;
        });
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        if (atBottom) current = items[items.length - 1];
        setActive(current.link);
    }

    function lockSpy(ms) {
        spyLock = true;
        clearTimeout(lockTimer);
        lockTimer = setTimeout(() => {
            spyLock = false;
            updateSpy();
        }, ms);
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            nav.classList.toggle("scrolled", window.scrollY > 10);
            if (spyLock) {
                lockSpy(150);
                return;
            }
            updateSpy();
        });
    }, { passive: true });

    items.forEach((item) => {
        item.link.addEventListener("click", () => {
            setActive(item.link);
            lockSpy(200);
            if (navMenu.classList.contains("show")) {
                bootstrap.Collapse.getOrCreateInstance(navMenu).hide();
            }
        });
    });

    if (brand && items.length) {
        brand.addEventListener("click", () => {
            setActive(items[0].link);
            lockSpy(200);
        });
    }

    window.addEventListener("resize", () => moveIndicator(activeLink));
    window.addEventListener("load", () => moveIndicator(activeLink));
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => moveIndicator(activeLink));
    }

    nav.classList.toggle("scrolled", window.scrollY > 10);
    updateSpy();

    const counters = document.querySelectorAll(".counter");

    function animateCounter(el) {
        const target = Number(el.dataset.count);
        if (reduceMotion || !target) { el.textContent = target; return; }

        const duration = 1200;
        const start = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    if ("IntersectionObserver" in window) {
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });

        counters.forEach((el) => {
            if (!reduceMotion) el.textContent = "0";
            counterObserver.observe(el);
        });
    }

    document.querySelectorAll(".project-img").forEach((img) => {
        img.addEventListener("error", () => {
            const placeholder = document.createElement("div");
            placeholder.className = "project-img-placeholder";
            placeholder.setAttribute("role", "img");
            placeholder.setAttribute("aria-label", img.alt);
            placeholder.innerHTML = '<i class="bi bi-image" aria-hidden="true"></i>';
            img.replaceWith(placeholder);
        }, { once: true });
    });

    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    const roleText = document.getElementById("roleText");
    if (roleText) {
        const roles = (roleText.dataset.roles || "")
            .split("|")
            .map((role) => role.trim())
            .filter(Boolean);

        if (roles.length > 1) {
            const HOLD_MS = 2200;
            const SWAP_MS = 450;
            const shift = reduceMotion ? "0%" : "100%";
            let index = 0;

            const nextRole = () => {
                index = (index + 1) % roles.length;

                const out = roleText.animate(
                    [
                        { transform: "translateY(0)", opacity: 1 },
                        { transform: "translateY(-" + shift + ")", opacity: 0 }
                    ],
                    { duration: SWAP_MS, easing: "ease-in", fill: "forwards" }
                );

                out.onfinish = () => {
                    out.cancel();
                    roleText.textContent = roles[index];

                    const enter = roleText.animate(
                        [
                            { transform: "translateY(" + shift + ")", opacity: 0 },
                            { transform: "translateY(0)", opacity: 1 }
                        ],
                        { duration: SWAP_MS, easing: "ease-out" }
                    );
                    enter.onfinish = () => setTimeout(nextRole, HOLD_MS);
                };
            };

            setTimeout(nextRole, HOLD_MS);
        }
    }

    const heroSlides = document.getElementById("heroSlides");
    if (heroSlides) {
        const heroImage = document.getElementById("heroImage");
        const homeBgImage = document.getElementById("homeBgImage");
        
        const gifList = [
            "images/hero/sukuna2.gif",
            "images/hero/sukuna3.gif",
            "images/hero/sukuna4.gif",
            "images/hero/sukuna5.gif",
            "images/hero/sukuna6.gif",
            "images/hero/sukuna7.gif",
            "images/hero/sukuna8.gif",
            "images/hero/sukuna9.gif",
            "images/hero/sukuna10.gif",
            "images/hero/sukuna11.gif",
            "images/hero/sukuna1.gif"
        ];

        if (gifList.length > 1) {
            let currentIndex = gifList.length - 1;

            setInterval(() => {
                heroImage.style.opacity = "0";
                if (homeBgImage) homeBgImage.classList.add("is-hidden");

                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % gifList.length;
                    
                    heroImage.src = gifList[currentIndex];
                    if (homeBgImage) homeBgImage.src = gifList[currentIndex];

                    heroImage.style.opacity = "1";
                    if (homeBgImage) homeBgImage.classList.remove("is-hidden");
                }, 400);

            }, 4000);
        }
    }

    const revealTargets = document.querySelectorAll(".project-card, .tech_stack-card, .achievement-card, .contact-card");

    if ("IntersectionObserver" in window && revealTargets.length) {
        const STAGGER_MS = 90;
        const DURATION_MS = 750;

        revealTargets.forEach((el) => {
            el.classList.add("reveal");
            if (reduceMotion) el.classList.add("reveal-soft");
        });

        const revealObserver = new IntersectionObserver((entries) => {
            const visible = entries.filter((entry) => entry.isIntersecting);

            visible.forEach((entry, i) => {
                const el = entry.target;
                const delay = i * STAGGER_MS;

                revealObserver.unobserve(el);
                el.style.transitionDelay = delay + "ms";
                el.classList.add("is-visible");

                setTimeout(() => {
                    el.style.transitionDelay = "";
                    el.classList.remove("reveal", "reveal-soft", "is-visible");
                }, delay + DURATION_MS);
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

        revealTargets.forEach((el) => revealObserver.observe(el));
    }

    const bgm = document.getElementById("bgm");
    const musicToggle = document.getElementById("musicToggle");
    const musicIcon = document.getElementById("musicIcon");

    if (bgm && musicToggle) {
        let isPlaying = false;

        bgm.volume = 0.4;

        musicToggle.addEventListener("click", () => {
            if (isPlaying) {
                bgm.pause();
                musicIcon.className = "bi bi-volume-mute-fill";
                isPlaying = false;
            } else {
                bgm.play().then(() => {
                    musicIcon.className = "bi bi-volume-up-fill";
                    isPlaying = true;
                }).catch(error => {
                    console.log("Gagal memutar audio: ", error);
                });
            }
        });
    }

    const sfxDownloadResume = "audio/download.mp3";

    const clickableCard = document.querySelectorAll(".download-btn");

    clickableCard.forEach(card => {
        card.addEventListener("click", () => {
            const selectedSound = sfxDownloadResume;

            const sound = new Audio(selectedSound);
            sound.volume = 1.0;
            
            sound.play().catch(error => {
                console.log("SFX blocked by the browser: ", error);
            });
        });
    });
    
    const introAudio = new Audio("audio/introduction.mp3");
    introAudio.volume = 1.0;
    introAudio.load();

    const triggerIntro = () => {
        introAudio.play().then(() => {
            console.log("Audio intro played successfully!");
        }).catch(error => {
            console.log("Failed to play audio intro: ", error);
        });

        window.removeEventListener("click", triggerIntro);
        window.removeEventListener("keydown", triggerIntro);
        window.removeEventListener("touchstart", triggerIntro);
    };

    window.addEventListener("click", triggerIntro, { once: true });
    window.addEventListener("keydown", triggerIntro, { once: true });
    window.addEventListener("touchstart", triggerIntro, { once: true });

    const achievementCards = document.querySelectorAll(".achievement-card");
    const imageModalElement = document.getElementById("imageModal");

    if (achievementCards.length > 0 && imageModalElement) {
        const modalInstance = new bootstrap.Modal(imageModalElement);
        const modalImg = document.getElementById("modalImg");
        const modalTitle = document.getElementById("modalTitle");
        const modalDesc = document.getElementById("modalDesc");

        achievementCards.forEach(card => {
            card.style.cursor = "pointer"; 

            card.addEventListener("click", () => {
                const img = card.querySelector("img");
                const title = card.querySelector("h4") ? card.querySelector("h4").textContent : "";
                const desc = card.querySelector("p") ? card.querySelector("p").textContent : "";

                if (img && modalImg) {
                    modalImg.src = img.src;
                    if (modalTitle) modalTitle.textContent = title;
                    if (modalDesc) modalDesc.textContent = desc;

                    modalInstance.show();
                }
            });
        });
    }

    const aboutImage = document.querySelector(".about-image img");

    if (aboutImage) {
        const aboutImageCandidates = [
            aboutImage.getAttribute("src"),
            "images/fadli2.jpeg",
            "images/fadli3.jpeg",
            "images/fadli4.jpeg",
            "images/fadli1.png"
        ];
        const uniqueSources = [...new Set(aboutImageCandidates.filter(Boolean))];

        const preload = (src) => new Promise((resolve) => {
            const probe = new Image();
            probe.onload = () => resolve(src);
            probe.onerror = () => resolve(null);
            probe.src = src;
        });

        Promise.all(uniqueSources.map(preload)).then((results) => {
            const sources = results.filter(Boolean);
            if (sources.length < 2) return;

            let index = 0;
            let busy = false;

            aboutImage.classList.add("is-switchable");
            aboutImage.setAttribute("role", "button");
            aboutImage.setAttribute("tabindex", "0");
            aboutImage.setAttribute("aria-label", "Click to change photo");

            const changeImage = () => {
                if (busy) return;
                busy = true;
                index = (index + 1) % sources.length;
                aboutImage.classList.add("is-swapping");

                setTimeout(() => {
                    aboutImage.src = sources[index];

                    const finish = () => {
                        aboutImage.classList.remove("is-swapping");
                        setTimeout(() => { busy = false; }, 250);
                    };
                    if (aboutImage.decode) aboutImage.decode().then(finish, finish);
                    else finish();
                }, 250);
            };

            aboutImage.addEventListener("click", changeImage);
            aboutImage.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    changeImage();
                }
            });
        });
    }
});