/**
* demo.js
* http://www.codrops.com
*
* Licensed under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
* 
* Copyright 2019, Codrops
* http://www.codrops.com
*/
{
    const MathUtils = {
        lineEq: (y2, y1, x2, x1, currentVal) => {
            const m = (y2 - y1) / (x2 - x1);
            const b = y1 - m * x1;
            return m * currentVal + b;
        },
        lerp: (a, b, n) => (1 - n) * a + n * b,
        getRandomFloat: (min, max) => (Math.random() * (max - min) + min).toFixed(2)
    };
    const body = document.body;
    const docEl = document.documentElement;

    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);

    // Gets the mouse position. From http://www.quirksmode.org/js/events_properties.html#position
    const getMousePos = (ev) => {
        let posx = 0;
        let posy = 0;
        if (!ev) e = window.event;
        if (ev.pageX || ev.pageY)   {
            posx = ev.pageX;
            posy = ev.pageY;
        }
        else if (ev.clientX || ev.clientY)  {
            posx = ev.clientX + body.scrollLeft + docEl.scrollLeft;
            posy = ev.clientY + body.scrollTop + docEl.scrollTop;
        }
        return { x : posx, y : posy }
    };
    let mousepos = {x: winsize.width/2, y: winsize.height/2};
    window.addEventListener('mousemove', ev => mousepos = getMousePos(ev));
    
    let activeTilt = {
        columns: true,
        letters: true,
    }

    // Custom cursor
    class Cursor {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.circle = this.DOM.el.querySelector('.cursor__inner--circle');
            this.bounds = this.DOM.circle.getBoundingClientRect();
            this.lastMousePos = {x:0, y:0};
            this.scale = 1;
            this.lastScale = 1;
            this.lastY = 0;
            requestAnimationFrame(() => this.render());
        }
        render() {
            this.lastMousePos.x = MathUtils.lerp(this.lastMousePos.x, mousepos.x - this.bounds.width/2, 0.15);
            this.lastMousePos.y = MathUtils.lerp(this.lastMousePos.y, mousepos.y - this.bounds.height/2, 0.15);
            this.direction = this.lastY - mousepos.y > 0 ? 'up' : 'down';
            this.lastScale = MathUtils.lerp(this.lastScale, this.scale, 0.15);
            this.DOM.circle.style.transform = `translateX(${(this.lastMousePos.x)}px) translateY(${this.lastMousePos.y}px) scale(${this.lastScale})`;
            this.lastY = mousepos.y;
            requestAnimationFrame(() => this.render());
        }
        enter() {
            this.scale = 1.5;
        }
        leave() {
            this.scale = 1;
        }
        click() {
            this.lastScale = .4;
        }
    }

    // Vertical images column
    class Column {
        constructor(el) {
            this.DOM = {el: el};

            // The column's height
            const rect = this.DOM.el.getBoundingClientRect();
            this.height = rect.height;
            
            // Check if the column starts on the top of the viewport or if it ends on the bottom of the viewport. This will define the column's translation direction.
            this.isBottom = this.DOM.el.classList.contains('column--bottom');

            // Tilt the column on mousemove.
            this.tilt();
        }
        tilt() {
            let translationVals = {tx: 0, ty: 0};
            const randX = MathUtils.getRandomFloat(5,20);
            const rY1 = this.isBottom ? MathUtils.getRandomFloat(10,30) : MathUtils.getRandomFloat(30,80);
            const rY2 = this.isBottom ? MathUtils.getRandomFloat(30,80) : MathUtils.getRandomFloat(10,30);
            const render = () => {
                if ( activeTilt.columns ) {
                    translationVals.tx = MathUtils.lerp(translationVals.tx, MathUtils.lineEq(-randX, randX, winsize.width, 0, mousepos.x), 0.03);
                    translationVals.ty = MathUtils.lerp(translationVals.ty, MathUtils.lineEq(this.isBottom ? -rY1 : rY2, this.isBottom ? rY2 : -rY1, winsize.height, 0, mousepos.y), 0.03);
                    TweenMax.set(this.DOM.el, {
                        x: translationVals.tx, 
                        y: translationVals.ty,
                        rotation: 0.01
                    });
                }
                else {
                    translationVals = {tx: 0, ty: 0};
                }
                requestAnimationFrame(render);
            }
            
            requestAnimationFrame(render);
        }
    }

    class ContentItem {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.title = this.DOM.el.querySelector('.item__content-title');
            // Create spans out of every letter
            charming(this.DOM.title);
            this.DOM.titleLetters = [...this.DOM.title.querySelectorAll('span')];
            this.titleLettersTotal = this.DOM.titleLetters.length;

            this.DOM.backCtrl = this.DOM.el.querySelector('.item__content-back');
            this.initEvents()
        }
        initEvents() {
            this.DOM.backCtrl.addEventListener('click', (ev) => {
                ev.preventDefault();
                menu.closeItem()
            });
        }
        setCurrent() {
            this.DOM.el.classList.add('item--current');
        }
        resetCurrent() {
            this.DOM.el.classList.remove('item--current');
        }
    }

    // A Menu Item
    class MenuItem {
        constructor(el) {
            this.DOM = {el: el};

            // Create spans out of every letter
            charming(this.DOM.el);
            this.DOM.letters = [...this.DOM.el.querySelectorAll('span')];
            this.lettersTotal = this.DOM.letters.length;

            // Total number of letters that move when hovering and moving the mouse
            this.totalRandomLetters = 3;
            this.totalRandomLetters = this.totalRandomLetters <= this.lettersTotal ? this.totalRandomLetters : this.lettersTotal
            // The amount that they move (y-axis)
            this.lettersTranslations = Array.from({length: this.totalRandomLetters}, _ => {
                const tr = MathUtils.getRandomFloat(10,50);
                return [-tr,tr];
            });
            this.lettersRotations = Array.from({length: this.totalRandomLetters}, _ => {
                const rr = MathUtils.getRandomFloat(0,6);
                return [-rr,rr];
            });
            
            // Init/Bind events
            this.initEvents();
        }
        initEvents() {
            // Initialize the random letters of the menu item that move when hovering and moving the mouse
            this.mouseenterFn = _ => {
                const shuffled = [...this.DOM.letters].sort(() => 0.5 - Math.random());
                this.DOM.randLetters = shuffled.slice(0, this.totalRandomLetters);
            };
            // Move the random letters up and down when moving the mouse
            this.mousemoveFn = (ev) => requestAnimationFrame(() => this.tilt(ev));
            // Reset the position of the random letters
            this.mouseleaveFn = _ => this.resetTilt();
            this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
            this.DOM.el.addEventListener('mousemove', this.mousemoveFn);
            this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
        }
        tilt(ev) {
            if ( !activeTilt.letters ) return;
            // Document scrolls
            const docScrolls = {left : body.scrollLeft + docEl.scrollLeft, top : body.scrollTop + docEl.scrollTop};
            const bounds = this.DOM.el.getBoundingClientRect();
            // Mouse position relative to the main element (this.DOM.el)
            const relmousepos = {x : mousepos.x - bounds.left - docScrolls.left, y : mousepos.y - bounds.top - docScrolls.top };
            for (const [index, letter] of this.DOM.randLetters.entries()) {
                TweenMax.to(letter, 3, {
                    ease: Expo.easeOut,
                    y: MathUtils.lineEq(this.lettersTranslations[index][1],this.lettersTranslations[index][0], bounds.height, 0, relmousepos.y),
                    rotation: MathUtils.lineEq(this.lettersRotations[index][1],this.lettersRotations[index][0], bounds.height, 0, relmousepos.y),
                });
            }
        }
        resetTilt() {
            if ( !activeTilt.letters ) return;
            new TimelineMax()
                .to(this.DOM.randLetters, 0.2, {
                    ease: Quad.easeOut,
                    y: cursor.direction === 'up' ? '-=80%' : '+=80',
                    rotation: cursor.direction === 'up' ? '-=10' : '+=10',
                    opacity: 0,
                }, 0)
                .staggerTo(this.DOM.randLetters, MathUtils.getRandomFloat(0.5,0.7), {
                    ease: Elastic.easeOut.config(1,0.4),
                    startAt: {y: cursor.direction === 'up' ? '80%' : '-80%', opacity: 0},
                    y: '0%',
                    rotation: 0,
                    opacity: 1
                }, 0.02, 0.2);
        }
    }

    class Menu {
        constructor(el) {
            this.DOM = {el: el};
            // The menu items
            this.DOM.items = document.querySelectorAll('.menu > .menu__item');
            this.menuItems = Array.from(this.DOM.items, item => new MenuItem(item));
            // Init/Bind events
            this.initEvents();
        }
        initEvents() {
            // Clicking a menu item opens up the content item and hides the menu (items)
            for (let menuItem of this.menuItems) {
                menuItem.DOM.el.addEventListener('click', () => this.openItem(menuItem));
            }
        }
        openItem(menuItem) {
            if ( this.isAnimating ) return;
            this.isAnimating = true;
            
            this.currentItem = this.menuItems.indexOf(menuItem);

            // Set the content item to current
            const contentItem = contentItems[this.currentItem];
            contentItem.setCurrent();
            
            // Disable tilts
            activeTilt.columns = false;
            activeTilt.letters = false;
            
            const duration = 1.2;
            const ease = new Ease(BezierEasing(1, 0, 0.735, 0.775));
            const columnsStagger = 0;

            this.openItemTimeline = new TimelineMax({
                onComplete: () => this.isAnimating = false,
            })
            // Animate columns out
            .staggerTo(columnsElems, duration, {
                ease: ease,
                cycle: {
                    y: (i,t) => t.classList.contains('column--bottom') ? columns[i].height+winsize.height*.2 : -1*columns[i].height-winsize.height*.2
                },
                //scaleX: 0.7,
                opacity: 0
            }, columnsStagger, 0)
            .to(columnsWrap, duration, {
                ease: ease,
                rotation: -2
            }, 0)
            
            // Animate menu items out
            .staggerTo(menuItem.DOM.letters, duration*.7, {
                ease: ease,
                cycle: {
                    y: (i,_) => i % 2 == 0 ? MathUtils.getRandomFloat(-250,-150) : MathUtils.getRandomFloat(150,250)
                },
                rotation: `+=${MathUtils.getRandomFloat(0,20)}`,
                opacity: 0
            }, -0.01, 0) 
            .to(this.menuItems.filter(item => item != menuItem).map(t => t.DOM.el), duration*.5, {
                ease: ease,
                opacity: 0
            }, 0)

            // Animate content.first and contentMove (unreveal effect: both move in different directions)
            .to(content.first, duration*0.8, {
                ease: Expo.easeOut,
                y: '100%'
            }, duration+duration*columnsStagger*columnsTotal)
            .to(contentMove, duration*0.8, {
                ease: Expo.easeOut,
                y: '-100%'
            }, duration+duration*columnsStagger*columnsTotal)

            // Animate the content item title letters
            .set(contentItem.DOM.titleLetters, {
                opacity: 0
            }, duration+duration*columnsStagger*columnsTotal)
            .staggerTo(contentItem.DOM.titleLetters, duration, {
                ease: Expo.easeOut,
                startAt: {
                    cycle: {
                        y: (i,_) => i % 2 == 0 ? MathUtils.getRandomFloat(-35,-15) : MathUtils.getRandomFloat(15,35),
                        rotation: MathUtils.getRandomFloat(-20,0)
                    }
                },
                y: 0,
                rotation: 0,
                opacity: 1
            }, -0.01, duration+duration*columnsStagger*columnsTotal);
        }
        closeItem() {
            if ( this.isAnimating ) return;
            this.isAnimating = true;

            const contentItem = contentItems[this.currentItem];

            const duration = 1;
            const ease = Sine.easeOut;
            
            this.openItemTimeline = new TimelineMax({
                onComplete: () => {
                    activeTilt.columns = true;
                    activeTilt.letters = true;
                    this.isAnimating = false;  
                }
            })
            .staggerTo(contentItem.DOM.titleLetters, duration*0.6, {
                ease: new Ease(BezierEasing(0.775,0.05,0.87,0.465)),
                cycle: {
                    y: (i,_) => i % 2 == 0 ? MathUtils.getRandomFloat(-35,-15) : MathUtils.getRandomFloat(15,35),
                    rotation: MathUtils.getRandomFloat(-20,0)
                },
                opacity: 0
            }, 0.01, 0) 

            // Animate content.first and contentMove (unreveal effect: both move in different directions)
            .to([content.first, contentMove], duration*0.6, {
                ease: new Ease(BezierEasing(0.775,0.05,0.87,0.465)),
                y: '0%',
                onComplete: () => {
                    // Reset the content item current classclass
                    contentItem.resetCurrent();
                }
            }, 0.2)

            // Animate columns in
            .staggerTo(columnsElems, duration, {
                ease: ease,
                y: 0,
                x: 0,
                //scaleX: 1,
                opacity: 1
            }, 0.02, duration*0.6)
            .to(columnsWrap, duration, {
                ease: ease,
                rotation: 0
            }, duration*0.6)
            
            // Animate menu items in
            .to(this.menuItems[this.currentItem].DOM.letters, duration*.6, {
                ease: Quint.easeOut,
                y: 0,
                opacity: 1,
                rotation: 0
            }, duration) 
            .to(this.DOM.items, duration*.6, {
                ease: ease,
                opacity: 1
            }, duration);
        }
    }

    // Custom mouse cursor
    const cursor = new Cursor(document.querySelector('.cursor'));
    // Content elements
    const content = {
        first: document.querySelector('.content--first'),
        second: document.querySelector('.content--second')
    };
    
    // Content items
    const contentItems = Array.from(content.second.querySelectorAll('.item'), item => new ContentItem(item));
    
    // content.first inner moving element (reveal/unreveal effect purposes)
    const contentMove = content.first.querySelector('.content__move');
    
    // The image columns behind the menu
    const columnsWrap = document.querySelector('.columns');
    const columnsElems = columnsWrap.querySelectorAll('.column');
    const columnsTotal = columnsElems.length;
    let columns;

    // The Menu
    const menu = new Menu(content.second.querySelector('.menu'));

    // Activate the enter/leave/click methods of the custom cursor when hovering in/out on every <a> and when clicking anywhere
    [...document.querySelectorAll('a')].forEach((link) => {
        link.addEventListener('mouseenter', () => cursor.enter());
        link.addEventListener('mouseleave', () => cursor.leave());
    });
    document.addEventListener('click', () => cursor.click());

    // Preload all the images in the page
    imagesLoaded(document.querySelectorAll('.column__img'), {background: true}, () => {
        columns = Array.from(columnsElems, column => new Column(column));       
        document.body.classList.remove('loading');
    });
}