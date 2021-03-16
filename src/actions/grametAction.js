import {writable} from 'svelte/store';

export const grametStatus = writable();

export function grametThumbAction(container, ofp){
    let img;
    let clone;
    //const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;
    const style = getComputedStyle(document.body);
    const gInnerHeight = parseFloat(style.getPropertyValue('--gramet-inner-height', 390).slice(0, -2)); //remove px

    const loadListener = () => {
        const gHeight = img.height;
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
export const setGramet = (pinchZoom, {pos, fl}) => {
    const plane = pinchZoom.parentNode.querySelector('svg');
    const position = parseFloat(pos);
    const level = parseFloat(fl);
    const img = document.getElementById('grametImg');
    const style = getComputedStyle(document.body);
    const gInnerHeight = parseFloat(style.getPropertyValue('--gramet-inner-height', 390).slice(0, -2)); //remove px
    const maxHeight = parseFloat(pinchZoom.parentNode.dataset.maxHeight || "370");
    const iWidth = img.width;
    //const iHeight = img.height;
    const nav = document.querySelector('nav');
    const nWidth = nav.clientWidth;
    let scale = nWidth/iWidth;
    const maxScale = maxHeight / (gInnerHeight + 50 + 10);  // we want the first 440px visible (why extra 10 ?)
    let x = 0;
    const position2pixel = (position) =>  {
        return (65 + ((iWidth - (65 * 2)) * position / 100)) * scale;
    }
    const placePlane = (plane, planePosition, planeLevel) => {
        // before and after flight, displays the full gramet
        plane.style.left = (x + (position2pixel(planePosition) - (plane.clientWidth / 2))) + 'px';
        plane.style.top = (((-0.57 * planeLevel + 292 + 33) * scale) - (plane.clientHeight / 2)) + 'px';//TODO
    }
    const imageOffsetForPosition = (position) => {
        const pixelPosX = position2pixel(position);
        if (pixelPosX > nWidth /2 && pixelPosX < (iWidth * scale) - (nWidth/2)){
            return -(pixelPosX - nWidth /2);
        }else{
            return 0;
        }
    }

    if (position <= 0 || position >= 100) {
        if (scale > maxScale) { 
            scale = maxScale;
            x = (nWidth - (iWidth * scale)) / 2;
        }
    } else {
        // in flight, zoom in on the inner Gramet
        scale = maxHeight / (gInnerHeight + 30 + 10);  // we want the first 420px visible (why extra 10 ?)
    }
    const offset = imageOffsetForPosition(position);
    if (offset !== 0) {
        x = offset;
    }
    placePlane(plane, position, level);
    img.style.display = "block";
    pinchZoom.style.maxHeight = `${maxHeight}px`;
    pinchZoom.appendChild(img);
    pinchZoom.setTransform({scale, x, y: 0});
    return {
        update({pos, fl}){
            const position = parseFloat(pos);
            const level = parseFloat(fl);
            const offset = imageOffsetForPosition(position);
            if (offset !== 0) {
                x = offset;
                pinchZoom.setTransform({x});
            }
            placePlane(plane, position, level);
        },
        destroy(){
            img.style.display = 'none';
            document.body.appendChild(img);
        }
    }
};

//To set the pinchzoom drawer height
// adjust the size of the parent (the larger the gramet, the less height)
export const setHeight = (container) => {
    const img = document.getElementById('grametImg');
    const gWidth = img.width;
    const gHeight = img.height;
    const maxHeight = parseFloat(container.dataset.maxHeight || "370");
    const nav = document.querySelector('nav');
    const nWidth = nav.clientWidth;
    const ratio = nWidth / gWidth;
    const height = Math.min(ratio * gHeight, maxHeight);
    container.style.height = `${height}px`;
}
