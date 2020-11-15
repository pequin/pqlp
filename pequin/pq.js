/*
 * Copyright 2020 Vasiliy Vdovin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class PQLP {

	constructor() {

		this.main      = null;
		this.wrap      = null;
		this.articles  = null;
		this.current   = null;   // Current article.
		this.article   = [];     // Article and index will change or moved.
		this.section   = [];     // Section and indexwill change or moved.
		this.index     = -1;     // Index of current section.
		this.direction = true;   // Direction of animation (to the right - true).
		this.timestamp = 0;      // Time of the last frame of the animation
		this.move      = 0;      // Animation frames counter.
		this.animation = false;  // Animation is currently running.
		this.nav       = null;   // Navigation button.
		this.zoomin    = false;  // State of navigation
		this.touch     = [0, 0]; // Starting coordinates of touch ([0 = y, 1 = x]).

		PQLP.listeners();

	}

	static listeners() {

		window.addEventListener("resize", function(e) {

			PQLP.scrolToCurrent();

		}, false);

		document.addEventListener("DOMContentLoaded", function(e) {

			const url = window.location.hash.replace("#", "").split("/");
			
			pqlp.main = document.getElementById("main");
			pqlp.wrap = document.getElementById("wrap");
			pqlp.nav  = document.getElementById("nav");
			
			const aAlias = url.length > 0 ? url[0] : null;
			const sAlias = url.length > 1 ? url[1] : null;

			pqlp.articles = pqlp.wrap.children;

			const articleAlias = aAlias ? PQLP.getArticleByAlias(aAlias) : [null, -1];

			pqlp.current = articleAlias[0] && articleAlias[1] > 0 ? articleAlias[0] : pqlp.wrap.firstElementChild;
			pqlp.index   = articleAlias[0] && articleAlias[1] > 0 ? articleAlias[1] : 0;

			pqlp.main.classList.add("zoomin");
			pqlp.nav.classList.add("zoomin");
			pqlp.current.classList.add("current");

			PQLP.scrolToCurrent();
			PQLP.zoom(true);

			pqlp.nav.addEventListener("click", PQLP.showNav);

			window.addEventListener('popstate', PQLP.popstate);

			Array.prototype.forEach.call(pqlp.articles, function(article) {

				article.addEventListener("click", function() {

					PQLP.zoomToClick(article);
				});

				article.visible = pqlp.current == article && sAlias ? PQLP.getSectionByAlias(article, sAlias)[0] : article.firstElementChild.firstElementChild;

				article.visible.classList.add("visible");

			});

			// Listener click in article nav.
			Array.prototype.forEach.call(pqlp.wrap.getElementsByTagName("nav"), function(nav) {

				Array.prototype.forEach.call(nav.getElementsByTagName("a"), function(a) {
					
					a.addEventListener("click", function(e) {

						const hash = new URL(e.target.href).hash

						if (hash.length > 0) {

							e.preventDefault();

							if (! pqlp.animation) {

								const url = hash.replace("#", "").split("/");
	
								const aAlias = url.length > 0 ? url[0] : null;
								const sAlias = url.length > 1 ? url[1] : null;

								const article = PQLP.getArticleByAlias(aAlias);
								const section = PQLP.getSectionByAlias(article[0], sAlias);

								if (aAlias && sAlias && ! pqlp.animation && ! (pqlp.current == article[0] && pqlp.current.visible == section[0])) {

									pqlp.animation = true;
									pqlp.move      = 0;

									pqlp.article = article;
									pqlp.section = section;
									
									requestAnimationFrame(PQLP.animationSection);
								}
							}
						}

					}, {passive: false});

				});

			});

		}, false);
	}

	static zoom(zoomin = false) {

		pqlp.zoomin = zoomin

		if (pqlp.zoomin) {

			pqlp.main.removeEventListener("wheel", PQLP.wheel);
			pqlp.main.removeEventListener("touchstart", PQLP.touchStart);
			pqlp.main.removeEventListener("touchmove", PQLP.touchMove);

		} else {

			pqlp.main.addEventListener("wheel", PQLP.wheel, {passive: false});
			pqlp.main.addEventListener("touchstart", PQLP.touchStart, {passive: true});
			pqlp.main.addEventListener("touchmove", PQLP.touchMove, {passive: false});
		}
	}

	static zoomToClick(target) {

		if (! pqlp.zoomin) {

			let index = 0;

			let i = 0;
			Array.prototype.forEach.call(pqlp.articles, function(article) {

				if (article == target) {
					index = i;
				}

				i++
			});

			const offset = index >=0 && index != pqlp.index? index - pqlp.index : 0;

			if (! pqlp.animation && offset == 0) {

				PQLP.zoom(true);

				requestAnimationFrame(PQLP.animationZoom);

			} else if (! pqlp.animation && offset != 0) {

				PQLP.zoom(true);

				PQLP.setNext(offset > 0);
			}
		}
	}

	static showNav() {

		if (! pqlp.animation) {
			pqlp.move = 0;
			pqlp.animation = true;

			PQLP.zoom(! pqlp.zoomin);

			requestAnimationFrame(PQLP.animationZoom);
		}
	}

	static animationZoom(timestamp) {

		// Speed ms.
		const speed  = 1000;

		const frames   = Math.ceil(speed / 16.666666666666668);
		const progress = pqlp.move / frames;

		if (! pqlp.zoomin, progress == 0) {

			pqlp.main.classList.replace("zoomin", "zoomout");
			pqlp.nav.classList.replace("zoomin", "zoomout");
		}

		if ((timestamp - pqlp.timestamp) > 15 && pqlp.current) { // ~ 60 fps

			const px  = pqlp.zoomin ? 300 * Math.pow((1 - progress), 3) : 300 - (300 * Math.pow((1 - progress), 3));
			const pct = (1 - Math.pow(Math.abs((progress * 2) -1), 3))
			
			pqlp.current.style.transform = "translate3d(0px, 0, -"+ px +"px) scale("+ (1 - (pct * 0.33333)) +") rotate3d(1, 1.5, -0.5, "+ (pct * 10) +"deg)";

			pqlp.move++
		}

		if (pqlp.move <= (frames)) {

			pqlp.timestamp = timestamp;

			requestAnimationFrame(PQLP.animationZoom);

		} else {

			if (pqlp.zoomin) {

				pqlp.main.classList.replace("zoomout", "zoomin");
				pqlp.nav.classList.replace("zoomout", "zoomin");
			}

			pqlp.current.style.transform = null;
			pqlp.move = 0;
			pqlp.animation = false;
		}
	}

	static animationShowContent(timestamp) {

		const speed    = 200; // Speed ms.
		const frames   = Math.ceil(speed / 16.666666666666668);
		const index    = pqlp.direction ? pqlp.index + 1 : pqlp.index - 1;
		const content  = index >= 0 && index < pqlp.articles.length ? pqlp.articles[index].firstElementChild : null;
		const progress = pqlp.move / frames;

		if ((timestamp - pqlp.timestamp) > 15) { // ~ 60 fps

			if (content && progress == 0) {

				content.style.cssText = "visibility: visible; opacity: 0;"

			} else if(content){

				content.style.opacity = 1 - Math.pow((1 - progress), 2);
			}

			pqlp.move++
		}

		if (progress < 1) {

			pqlp.timestamp = timestamp;

			requestAnimationFrame(PQLP.animationShowContent);

		} else {

			pqlp.move = 0;
			pqlp.animation = false;
			content.style.cssText = null;

			if (pqlp.zoomin) {
	
				requestAnimationFrame(PQLP.animationZoom);
			}
		}
	}

	static animationSetNext(timestamp) {

		// Speed ms.
		const speed = 800;

		// Verify is the current section extreme.
		const isExtreme = (! pqlp.direction && pqlp.index == 0) || (pqlp.direction && (pqlp.index + 1)== pqlp.articles.length);

		// Current frame.
		const frame  = pqlp.move + 1;

		// total number of frames.
		const frames = Math.ceil(speed / 16.666666666666668);

		const nextSteps = (frames / 2);
		const backSteps = (frames / 2);

		const gap    = 40;
		const offset = pqlp.main.clientWidth / 2;

		const progressForward  = pqlp.move / nextSteps;
		const progressBack     = (frame  - nextSteps - 1) / backSteps;

		const indexOfPrevious  = pqlp.direction ? pqlp.index - 1 : pqlp.index + 1;
		const indexOfNext      = pqlp.direction ? pqlp.index + 1 : pqlp.index - 1;
		const indexOfFollowing = pqlp.direction ? pqlp.index + 2 : pqlp.index - 2;

		const sectionPrevious  = indexOfPrevious  >= 0 && indexOfPrevious  < pqlp.articles.length ? pqlp.articles[indexOfPrevious] : null;
		const sectionNext      = indexOfNext      >= 0 && indexOfNext      < pqlp.articles.length ? pqlp.articles[indexOfNext] : null;
		const sectionFollowing = indexOfFollowing >= 0 && indexOfFollowing < pqlp.articles.length ? pqlp.articles[indexOfFollowing] : null;

		if ((timestamp - pqlp.timestamp) > 15) { // ~ 60 fps

			if (! isExtreme) {

				if (progressForward <= 1) {

					const vector = Math.pow(progressForward, 2);

					if (sectionFollowing && progressForward == 0) {

						sectionFollowing.firstElementChild.style.visibility = "hidden";
					}

					if (pqlp.current) {

						const scale     = 1 - (0.33333333 * vector);
						const translate = ((offset * 0.666666) + gap) * vector;

						pqlp.current.style.transform = "translate3d("+ (pqlp.direction ? -translate : translate) +"px, 0, -300px) scaleX("+ scale +")";
					}

					if (sectionPrevious) {

						sectionPrevious.style.transform = "translate3d("+ (pqlp.direction? "-": "") + (gap * vector) +"px, 0, -300px) scaleX("+ (1 - (0.33333333 * vector)) +")"
					}

					if (sectionNext) {

						sectionNext.style.transform = "translate3d("+ (pqlp.direction? "-": "") + (((offset * 0.666666) + gap) * vector) +"px, 0, -300px) scaleX("+ (1 + (0.33333333 * vector)) +")"
					}

				} else if(progressBack <= 1) {

					const indexOfNext = pqlp.direction ? pqlp.index + 2 : pqlp.index - 2;

					const vector = Math.pow((1 - progressBack), 2);

					if (pqlp.current) {

						const scale     = 1 - (0.33333333 * vector);
						const translate = (((offset * 0.666666) + gap) + (((offset * 1.333) + gap)) * (1 - vector));

						pqlp.current.style.transform = "translate3d("+ (pqlp.direction ? -translate : translate) +"px, 0, -300px) scaleX("+ scale +")";
					}

					if (sectionPrevious) {

						sectionPrevious.style.transform = "translate3d("+ (pqlp.direction? "-": "") + (gap + (((offset * 2 + gap) * (1 - vector)))) +"px, 0, -300px) scaleX("+ (1 - (0.33333333 * vector)) +")"
					}

					if (sectionNext) {

						sectionNext.style.transform = "translate3d("+ (pqlp.direction? "-": "") + (((offset * 0.666666) + gap) + ((((offset * 1.333) + gap) * (1 - vector)))) +"px, 0, -300px) scaleX("+ (1 + (0.33333333 * vector)) +")"
					}

					if (sectionFollowing) {
						
						sectionFollowing.style.transform = "translate3d("+ (pqlp.direction? "-": "") + (((offset + gap) * 0.3333) + (((offset + gap) * 1.666) * (1 - vector)) )   +"px, 0, -300px) scaleX(1)"
					}
				}

			} else if (progressBack <= 1) { // Current section is extreme.

				const vector = progressForward <= 1 ? 1 - Math.pow((1 - progressForward), 3) :  Math.pow((1 - progressBack), 3);

				if (pqlp.current) {

					pqlp.current.style.transform = "translate3d(0, 0, -300px) scaleX("+ (1 + (0.33333333 * vector)) +")";
				}

				if (sectionPrevious) {

					sectionPrevious.style.transform = "translate3d("+ (pqlp.direction? "-": "") + (gap * vector) +"px, 0, -300px) scaleX("+ (1 - (0.33333333 * vector)) +")"
				}
			}
			
			pqlp.move++
		}

		if (pqlp.move <= (frames)) {

			pqlp.timestamp = timestamp;

			requestAnimationFrame(PQLP.animationSetNext);

		} else {
			
			pqlp.move = 0;

			Array.prototype.forEach.call(pqlp.articles, function(article) {

				article.style.transform = null;
			});

			pqlp.main.scrollLeft = pqlp.direction ? pqlp.main.scrollLeft + (pqlp.main.clientWidth + (gap * 2)) : pqlp.main.scrollLeft - (pqlp.main.clientWidth + (gap * 2));

			// Change the current section.
			const indexOfNext = pqlp.direction ? pqlp.index + 1 : pqlp.index - 1;

			if (indexOfNext >= 0 && indexOfNext < pqlp.articles.length) {

				pqlp.current.classList.remove("current");

				pqlp.current = pqlp.articles[indexOfNext];

				pqlp.current.classList.add("current");

				pqlp.index = indexOfNext;

			}
			

			if (sectionFollowing) {

				pqlp.animation = true;

				PQLP.animationShowContent();

			} else {

				pqlp.animation = false;

				if (pqlp.zoomin) {
	
					requestAnimationFrame(PQLP.animationZoom);
				}
			}
		}
	}

	// Mouse wheel event.
	static wheel(e) {

		e.preventDefault();

		if (!pqlp.zoomin && ! pqlp.animation && e.deltaY == 0 && e.deltaX != 0) {

			PQLP.setNext(e.deltaX > 0);

		} else if (! pqlp.zoomin && ! pqlp.animation && e.deltaY != 0 && e.deltaX == 0)  {

			PQLP.setNext(e.deltaY > 0);
		}
	}

	static touchStart(e) {

		pqlp.touch = [e.touches[0].clientY, e.touches[0].clientX]
	}

	static touchMove(e) {

		e.preventDefault();

		// const y = e.touches[0].clientY - pqlp.touch[0]
		const x = e.touches[0].clientX - pqlp.touch[1]

		if (! pqlp.zoomin && !pqlp.animation) {

			PQLP.setNext(x < 0);
		}
	}

	static getArticleByAlias(alias) {

		let result = null;
		let index = 0;
		let i = 0;

		Array.prototype.forEach.call(pqlp.articles, function(article) {

			if (alias == article.dataset.alias) {

				index = i;
				result = article;
			}
			i++;
		});

		if (result == null) {

			result = pqlp.current;
		}

		return [result, index];
	}

	static getSectionByAlias(article, alias) {

		let result = null;
		let index = 0;
		let i = 0;

		Array.prototype.forEach.call(article.getElementsByTagName("section"), function(section) {

			if (alias == section.dataset.alias) {
				
				index = i;
				result = section;
			}
			i++;
		});

		if (result == null) {

			result = pqlp.visible;
		}

		return [result, index];
	}

	static animationSection(timestamp) {

		const speed    = 1000; // Speed ms.
		const frames   = Math.ceil(speed / 16.666666666666668);
		const progress = pqlp.move / frames;

		if ((timestamp - pqlp.timestamp) > 15) { // ~ 60 fps

			if (progress == 0) {

				pqlp.article[0].visible.classList.remove("visible");
				pqlp.article[0].visible.style.cssText = "z-index: 1; display: block; opacity: 1;"

				if (pqlp.current != pqlp.article[0]) {
					
					pqlp.article[0].style.cssText = "z-index: 99; transform: translate3d(0, 0, 0) scale(1);"
				}

			} else {

				const vector = 1 - Math.pow((1 - progress), 3);

				pqlp.section[0].style.cssText = "z-index: 3; display: block; opacity: "+ vector +"; transform: translate3d("+ (pqlp.current.offsetLeft - pqlp.article[0].offsetLeft) +"px, 0,  0) scale("+ vector +");"

			}



			pqlp.move++
		}

		if (progress < 1) {

			pqlp.timestamp = timestamp;

			requestAnimationFrame(PQLP.animationSection);

		} else {

			pqlp.animation = false;
			pqlp.move = 0;

			pqlp.article[0].style.cssText = null;
			pqlp.section[0].style.cssText = null;
			pqlp.article[0].visible.style.cssText = null;

			if (pqlp.current != pqlp.article[0]) {
				
				pqlp.current.classList.remove("current");
				pqlp.current = pqlp.article[0];
				pqlp.index   = pqlp.article[1];
				pqlp.current.classList.add("current");
				PQLP.scrolToCurrent();
			}

			pqlp.current.visible = pqlp.section[0];
			pqlp.current.visible.classList.add("visible");
		}
	}

	static popstate(e) {

		const url = window.location.hash.replace("#", "").split("/");

		const aAlias = url.length > 0 ? url[0] : null;
		const sAlias = url.length > 1 ? url[1] : null;

		const article = aAlias ? PQLP.getArticleByAlias(aAlias) : null;
		const section = aAlias && sAlias ? PQLP.getSectionByAlias(article[0], sAlias) : null;
		
		if (article && pqlp.current != article[0]) {

			pqlp.current.classList.remove("current");
			pqlp.current = article[0];
			pqlp.index   = article[1];
			pqlp.current.classList.add("current");
			PQLP.scrolToCurrent();
		}

		if (section && pqlp.current.visible != section[0]) {

			pqlp.current.visible.classList.remove("visible");
			pqlp.current.visible = section[0];
			pqlp.current.visible.classList.add("visible");
		}
	}

	// Move nav to forward or back.
	static setNext(next = true) {

		if (! pqlp.animation) {

			pqlp.animation = true;

			pqlp.direction = next;

			PQLP.animationSetNext();
		}
	}

	static scrolToCurrent() {

		pqlp.main.scrollLeft = pqlp.main.scrollLeft + (pqlp.current.offsetLeft - pqlp.main.scrollLeft);
	}
}

const pqlp = new PQLP();