import {writable} from 'svelte/store';

export const grametStatus = writable();
export const grametWidth = writable();
export const grametHeight = writable();

export function grametThumbAction(container, ofp){
    let img;
    let clone;
    //const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;
    const style = getComputedStyle(document.body);
    const gHeight = parseFloat(style.getPropertyValue('--gramet-height', 700).slice(0, -2)); //remove px
    const gInnerHeight = parseFloat(style.getPropertyValue('--gramet-inner-height', 380).slice(0, -2)); //remove px

    const loadListener = () => {
        grametWidth.set(img.width);
        grametHeight.set(img.height);
        clone = img.cloneNode();
        clone.id = "grametImg";
        clone.style.display = 'none';
        clone.addEventListener('load', cloneLoadListener); // Safari required the clone to be loaded before adding it to pinchzoom
        clone.addEventListener('error', errorListener);
        document.body.appendChild(clone);
        img.style.height = `${(gHeight/gInnerHeight) * cHeight}px`; // 700 is the full gramet height, 380 is the real gramet height
        img.style.objectFit = 'contain';
        img.style.position =  'absolute';
        img.style.opacity = 0.01;
        container.appendChild(img);
        //const w = img.clientWidth;
        const h = img.clientHeight;
        const ratio = h / 700;
        img.style.top = `-${30 * ratio}px`; // 30px is the top frame size of the gramet (white border)
        img.style.left = `-${64 * ratio}px`;// 64px is the left/right frame size of the gramet (white border)
    };
    const cloneLoadListener = () => {
        grametStatus.set('success');
        img.style.opacity = 1;
    };
    const errorListener = () => {
        grametStatus.set('error');
    };
    const cleanup = () => {
        if (img) img.removeEventListener('load', loadListener);
        if (img) img.removeEventListener('error', errorListener);
        if (img) img.remove();
        if (clone) clone.removeEventListener('load', cloneLoadListener);
        if (clone) clone.removeEventListener('error', errorListener);
        if (clone) clone.remove();
        clone = undefined;
        img = undefined;
    }
    const createImg = (ofp) => {
        img = document.createElement('img')

        img.addEventListener('load', loadListener);
        img.addEventListener('error', errorListener);
        grametStatus.set('loading');
        img.src = ofp.ogimetData.proxyImg;
    };
    createImg(ofp);

    return {
        update(ofp){
            cleanup();
            createImg(ofp);
        },
        destroy(){
            cleanup();
        }
    }
}


//To load Gramet Img im pinchzoom
//due to problem with Safari, we keep a clone in the document
//that way there is less reload and incomplete image appearing in the pinchzoom view
export const setGramet = (pinchZoom) => {
    const img = document.getElementById('grametImg');//e.target;
    const iWidth = img.width;
    const nav = document.querySelector('nav');
    const nWidth = nav.clientWidth;
    // console.log(img, iWidth, nav, nWidth);
    const ratio = nWidth/iWidth;
    img.classList.remove("invisible");
    img.style.display = "block";
    pinchZoom.appendChild(img);
    const timeout = setTimeout(() => {
        pinchZoom.setTransform({scale: ratio, x:0, y: 0});
    }, 100);
    return {
        destroy(){
            clearTimeout(timeout);
            img.style.display = 'none';
            document.body.appendChild(img);
        }
    }
};

//To set the pinchzoom drawer height
// adjust the size of the parent (the larger the gramet, the less height)
export const setHeight = (container, grametWidth) => {
    const style = getComputedStyle(document.body);
    const gHeight = parseFloat(style.getPropertyValue('--gramet-height', 700).slice(0, -2)); //remove px
    const gInnerHeight = parseFloat(style.getPropertyValue('--gramet-inner-height', 380).slice(0, -2)); //remove px
    const nav = document.querySelector('nav');
    const nWidth = nav.clientWidth;
    const ratio = nWidth / grametWidth;
    const height = Math.min(ratio * gHeight, gInnerHeight);
    container.style.height = `${height}px`;
    container.style.minHeight = `${height}px`;
}
