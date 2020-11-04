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

		this.main = null;
		this.navSections = null;
		this.current = null;
		this.currentIndex = -1;

		// direction of move (to the right - true).
		this.animationD = true;
		this.animationT = 0;
		this.animationStart = false;

		this.buttonShowNav = null;

		this.zoomin = false;

		// Animation iteration counter.
		this.move = 0; 

		this.touch = [0, 0];

		PQLP.eventslistener();

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


	// Event content loaded.
	loaded(e) {

		this.main        = document.getElementById("main");
		this.navSections = document.getElementsByClassName("section");
		this.buttonShowNav = document.getElementById("show-nav");

		PQLP.setCurrent("index");
		PQLP.scrolToCurrent();

		PQLP.zoom(true);
		pqlp.main.classList.add("zoomin");
		pqlp.buttonShowNav.classList.add("zoomin");
		this.buttonShowNav.addEventListener("click", PQLP.showNav);

		let i = 0;
		Array.prototype.forEach.call(pqlp.navSections, function(section) {

			if (section == pqlp.current) {
				pqlp.currentIndex = i;
			}

			section.addEventListener("click", function(e) {

				PQLP.zoomToClick(section);
			});

			i++
		});
	}

	static eventslistener() {

		window.addEventListener("resize", function(e) {

			PQLP.scrolToCurrent();

		}, false);

		document.addEventListener("DOMContentLoaded", function(e) {

			pqlp.loaded(e);

		}, false);
	}

	static zoomToClick(target) {

		if (! pqlp.zoomin) {

			let index = 0;

			let i = 0;
			Array.prototype.forEach.call(pqlp.navSections, function(section) {

				if (section == target) {
					index = i;
				}
				i++
			});

			const offset = index >=0 && index != pqlp.currentIndex? index - pqlp.currentIndex : 0;

			if (! pqlp.animationStart && offset == 0) {

				// pqlp.move = 0;
				// pqlp.animationStart = true;

				PQLP.zoom(true);

				requestAnimationFrame(PQLP.animationZoom);

			} else if (! pqlp.animationStart && offset != 0) {

				// pqlp.move = 0;
				// pqlp.animationStart = true;

				PQLP.zoom(true);

				PQLP.setNext(offset > 0);
			}
		}
	}

	static showNav() {

		if (! pqlp.animationStart) {
			pqlp.move = 0;
			pqlp.animationStart = true;

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
			pqlp.buttonShowNav.classList.replace("zoomin", "zoomout");
		}

		if ((timestamp - pqlp.animationT) > 15 && pqlp.current) { // ~ 60 fps

			const px = pqlp.zoomin ? 300 * Math.pow((1 - progress), 3) : 300 - (300 * Math.pow((1 - progress), 3));

			const pct = (1 - Math.pow(Math.abs((progress * 2) -1), 3))
			
			pqlp.current.style.transform = "translate3d(0px, 0, -"+ px +"px) scale("+ (1 - (pct * 0.33333)) +") rotate3d(1, 1.5, -0.5, "+ (pct * 10) +"deg)";

			pqlp.move++
		}

		if (pqlp.move <= (frames)) {

			pqlp.animationT = timestamp;

			requestAnimationFrame(PQLP.animationZoom);

		} else {

			if (pqlp.zoomin) {

				pqlp.main.classList.replace("zoomout", "zoomin");
				pqlp.buttonShowNav.classList.replace("zoomout", "zoomin");
			}

			pqlp.current.style.transform = null;
			pqlp.move = 0;
			pqlp.animationStart = false;
		}
	}

	static animationShowContent(timestamp) {

		// Speed ms.
		const speed  = 200;

		const frames   = Math.ceil(speed / 16.666666666666668);
		const index    = pqlp.animationD ? pqlp.currentIndex + 1 : pqlp.currentIndex - 1;
		const section  = index >= 0 && index < pqlp.navSections.length ? pqlp.navSections[index] : null;
		const div      = section ? section.getElementsByClassName("content") : null;
		const content  = div && div.length > 0 ? div[0] : null;
		const progress = pqlp.move / frames;

		if ((timestamp - pqlp.animationT) > 15) { // ~ 60 fps

			if (content && progress == 0) {

				content.style.cssText = "visibility: visible; opacity: 0;"

			} else if(content){

				content.style.opacity = 1 - Math.pow((1 - progress), 2);
			}

			pqlp.move++
		}

		if (progress < 1) {

			pqlp.animationT = timestamp;

			requestAnimationFrame(PQLP.animationShowContent);

		} else {

			pqlp.move = 0;
			pqlp.animationStart = false;

			if (pqlp.zoomin) {

				requestAnimationFrame(PQLP.animationZoom);
			}
		}
	}

	static animationSetNext(timestamp) {

		// Speed ms.
		const speed = 800;

		// Verify is the current section extreme.
		const isExtreme = (! pqlp.animationD && pqlp.currentIndex == 0) || (pqlp.animationD && (pqlp.currentIndex + 1)== pqlp.navSections.length);

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

		const indexOfPrevious  = pqlp.animationD ? pqlp.currentIndex - 1 : pqlp.currentIndex + 1;
		const indexOfNext      = pqlp.animationD ? pqlp.currentIndex + 1 : pqlp.currentIndex - 1;
		const indexOfFollowing = pqlp.animationD ? pqlp.currentIndex + 2 : pqlp.currentIndex - 2;

		const sectionPrevious  = indexOfPrevious  >= 0 && indexOfPrevious  < pqlp.navSections.length ? pqlp.navSections[indexOfPrevious] : null;
		const sectionNext      = indexOfNext      >= 0 && indexOfNext      < pqlp.navSections.length ? pqlp.navSections[indexOfNext] : null;
		const sectionFollowing = indexOfFollowing >= 0 && indexOfFollowing < pqlp.navSections.length ? pqlp.navSections[indexOfFollowing] : null;

		if ((timestamp - pqlp.animationT) > 15) { // ~ 60 fps

			if (! isExtreme) {

				if (progressForward <= 1) {

					const vector = Math.pow(progressForward, 2);

					if (sectionFollowing && progressForward == 0) {
						
						const content = sectionFollowing.getElementsByClassName("content");

						if(content.length > 0) {

							content[0].style.visibility = "hidden";
						}
					}

					if (pqlp.current) {

						const scale     = 1 - (0.33333333 * vector);
						const translate = ((offset * 0.666666) + gap) * vector;

						pqlp.current.style.transform = "translate3d("+ (pqlp.animationD ? -translate : translate) +"px, 0, -300px) scaleX("+ scale +")";
					}

					if (sectionPrevious) {

						sectionPrevious.style.transform = "translate3d("+ (pqlp.animationD? "-": "") + (gap * vector) +"px, 0, -300px) scaleX("+ (1 - (0.33333333 * vector)) +")"
					}

					if (sectionNext) {

						sectionNext.style.transform = "translate3d("+ (pqlp.animationD? "-": "") + (((offset * 0.666666) + gap) * vector) +"px, 0, -300px) scaleX("+ (1 + (0.33333333 * vector)) +")"
					}

				} else if(progressBack <= 1) {

					const indexOfNext = pqlp.animationD ? pqlp.currentIndex + 2 : pqlp.currentIndex - 2;

					const vector = Math.pow((1 - progressBack), 2);

					if (pqlp.current) {

						const scale     = 1 - (0.33333333 * vector);
						const translate = (((offset * 0.666666) + gap) + (((offset * 1.333) + gap)) * (1 - vector));

						pqlp.current.style.transform = "translate3d("+ (pqlp.animationD ? -translate : translate) +"px, 0, -300px) scaleX("+ scale +")";
					}

					if (sectionPrevious) {

						sectionPrevious.style.transform = "translate3d("+ (pqlp.animationD? "-": "") + (gap + (((offset * 2 + gap) * (1 - vector)))) +"px, 0, -300px) scaleX("+ (1 - (0.33333333 * vector)) +")"
					}

					if (sectionNext) {

						sectionNext.style.transform = "translate3d("+ (pqlp.animationD? "-": "") + (((offset * 0.666666) + gap) + ((((offset * 1.333) + gap) * (1 - vector)))) +"px, 0, -300px) scaleX("+ (1 + (0.33333333 * vector)) +")"
					}

					if (sectionFollowing) {
						
						sectionFollowing.style.transform = "translate3d("+ (pqlp.animationD? "-": "") + (((offset + gap) * 0.3333) + (((offset + gap) * 1.666) * (1 - vector)) )   +"px, 0, -300px) scaleX(1)"
					}
				}

			} else if (progressBack <= 1) { // Current section is extreme.

				const vector = progressForward <= 1 ? 1 - Math.pow((1 - progressForward), 3) :  Math.pow((1 - progressBack), 3);

				if (pqlp.current) {

					pqlp.current.style.transform = "translate3d(0, 0, -300px) scaleX("+ (1 + (0.33333333 * vector)) +")";
				}

				if (sectionPrevious) {

					sectionPrevious.style.transform = "translate3d("+ (pqlp.animationD? "-": "") + (gap * vector) +"px, 0, -300px) scaleX("+ (1 - (0.33333333 * vector)) +")"
				}
			}
			
			pqlp.move++
		}

		if (pqlp.move <= (frames)) {

			pqlp.animationT = timestamp;

			requestAnimationFrame(PQLP.animationSetNext);

		} else {

			Array.prototype.forEach.call(pqlp.navSections, function(section) {
				section.style.transform = null;
			});

			pqlp.main.scrollLeft = pqlp.animationD ? pqlp.main.scrollLeft + (pqlp.main.clientWidth + (gap * 2)) : pqlp.main.scrollLeft - (pqlp.main.clientWidth + (gap * 2));

			// Change the current section.
			const indexOfNext = pqlp.animationD ? pqlp.currentIndex + 1 : pqlp.currentIndex - 1;

			if (indexOfNext >= 0 && indexOfNext < pqlp.navSections.length) {

				pqlp.current.classList.remove("current");

				pqlp.current = pqlp.navSections[indexOfNext];

				pqlp.current.classList.add("current");

				pqlp.currentIndex = indexOfNext;

			}

			pqlp.move = 0;
			pqlp.animationStart = true;

			PQLP.animationShowContent();
		}
	}

	// Mouse wheel event.
	static wheel(e) {

		e.preventDefault();

		if (!pqlp.zoomin && ! pqlp.animationStart && e.deltaY == 0 && e.deltaX != 0) {

			PQLP.setNext(e.deltaX > 0);

		} else if (! pqlp.zoomin && ! pqlp.animationStart && e.deltaY != 0 && e.deltaX == 0)  {

			PQLP.setNext(e.deltaY > 0);

		}

	}

	static touchStart(e) {

		// e.preventDefault();

		pqlp.touch = [e.touches[0].clientY, e.touches[0].clientX]

	}

	static touchMove(e) {

		e.preventDefault();

		// const y = e.touches[0].clientY - pqlp.touch[0]
		const x = e.touches[0].clientX - pqlp.touch[1]

		if (! pqlp.zoomin && !pqlp.animationStart) {

			PQLP.setNext(x < 0);
		}
	}

	// Set nav section as default.
	static setCurrent(elementID = null) {

		if (elementID) {

			if (pqlp.current) {

				pqlp.current.classList.remove("current");
			}

			pqlp.current = document.getElementById(elementID);

			pqlp.current.classList.add("current");

			let i = 0;
			Array.prototype.forEach.call(pqlp.navSections, function(section) {

				if (section == pqlp.current) {
					pqlp.currentIndex = i;
				}

				i++
			});
		}
	}

	// Move nav to forward or back.
	static setNext(next = true) {

		if (! pqlp.animationStart) {

			pqlp.animationStart = true;

			pqlp.animationD = next;

			PQLP.animationSetNext();
		}
	}

	static scrolToCurrent() {

		pqlp.main.scrollLeft = pqlp.main.scrollLeft + (pqlp.current.offsetLeft - pqlp.main.scrollLeft);
	}
}

const pqlp = new PQLP()