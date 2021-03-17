import {writable} from 'svelte/store';

export const grametStatus = writable();
const grametMargin = 65; // left and right margin to the "inner gramet" image in px
const grametTop = 31;// top margin to the "inner gramet" image in px

export function grametThumbAction(container, {ofp, pos}){
    const plane = document.getElementById('gt-plane');
    let position = parseFloat(pos);
    let ofpDescription = ofp.description;
    let img;
    let clone;
    let iWidth; // the image width (small size computed by browser)
    let scale;
    const viewportHeight = container.clientHeight;
    const viewportWidth = container.clientWidth;
    const style = getComputedStyle(document.body);
    const gInnerHeight = parseFloat(style.getPropertyValue('--gramet-inner-height', 395).slice(0, -2)); //remove px
    const position2pixel = (position) =>  {
        return ((grametMargin * scale) + ((iWidth - (grametMargin * 2 * scale)) * position / 100));
    }
    const placePlane = (plane, planePosition, x) => {
        if(plane){
            plane.style.left = (x + (position2pixel(planePosition) - (plane.clientWidth / 2))) + 'px';
            plane.style.top = ((120 * scale) - (plane.clientHeight / 2)) + 'px';//TODO
        }
    }
    const imageOffsetForPosition = (position) => {
        const pixelPosX = position2pixel(position);
        const margin = grametMargin * scale; // in the thubnail we hide the left and right margin
        const iw = iWidth;
        const lock = viewportWidth /3; // plane locked position when we scroll image
        const min = margin + lock;
        const max = (iw - margin) - (viewportWidth - lock)
        if (pixelPosX > (min) && pixelPosX < max){
            return lock - pixelPosX;
        }else if(pixelPosX <= min){
            return lock - min;
        }else{
            return lock -max;
        }
    }
    const loadListener = () => {
        const gHeight = img.height;
        clone = img.cloneNode();
        clone.id = "grametImg";
        clone.style.display = 'none';
        clone.crossOrigin = "anonymous"; // otherwise sw does not cache
        clone.addEventListener('load', cloneLoadListener); // Safari required the clone to be loaded before adding it to pinchzoom
        clone.addEventListener('error', errorListener);
        document.body.appendChild(clone);
        img.style.height = `${(gHeight/gInnerHeight) * viewportHeight}px`; // 700 is the full gramet height, 380 is the real gramet height
        img.style.objectFit = 'contain';
        img.style.position =  'absolute';
        img.style.opacity = 0.01;
        container.appendChild(img);
        iWidth= img.clientWidth;
        const h = img.clientHeight;
        const ratio = h / gHeight;
        scale = ratio;
        const offset = imageOffsetForPosition(position);
        img.style.top = `-${grametTop * ratio}px`;
        img.style.left = `${offset}px`;
        placePlane(plane, position, offset);
    };
    const cloneLoadListener = () => {
        grametStatus.set('success');
        plane.style.display = 'block';
        img.style.opacity = 1;
    };
    const errorListener = () => {
        plane.style.display = 'none';
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
        img.crossOrigin = "anonymous"; // otherwise sw does not cache
    };
    createImg(ofp);

    return {
        update({ofp, pos}){
            position = parseFloat(pos);
            if (ofp.description !== ofpDescription) {
                ofpDescription = ofp.description;
                cleanup();
                createImg(ofp);
            }else{
                const offset = imageOffsetForPosition(position);
                img.style.left = offset  + 'px';
                placePlane(plane, position, offset);
            }
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
    const img = document.getElementById('grametImg');
    const style = getComputedStyle(document.body);
    const gInnerHeight = parseFloat(style.getPropertyValue('--gramet-inner-height', 395).slice(0, -2)); //remove px
    const maxHeight = parseFloat(pinchZoom.parentNode.dataset.maxHeight || "370");
    const iWidth = img.width;
    //const iHeight = img.height;
    const nav = document.querySelector('nav');
    const viewportWidth = nav.clientWidth;
    let position = parseFloat(pos);
    let scale;
    let x = 0;
    let y = 0;
    let level = parseFloat(fl);
    let allowImgScroll;
    const position2pixel = (position) =>  {
        return (grametMargin + ((iWidth - (grametMargin * 2)) * position / 100)) * scale;
    }
    const placePlane = (plane, planePosition, planeLevel) => {
        // before and after flight, displays the full gramet
        plane.style.left = (x + (position2pixel(planePosition) - (plane.clientWidth / 2))) + 'px';
        plane.style.top = (((-0.57 * planeLevel + 292 + grametTop) * scale) - (plane.clientHeight / 2)) + y + 'px';//TODO
    }
    const imageOffsetForPosition = (position) => {
        const pixelPosX = position2pixel(position);
        const margin = 0; // we do not try to hide the left/right margin in this view
        const lock = viewportWidth /3;
        const min = margin + lock;
        const iw = iWidth * scale; // the scale here is due to pinchzoom
        const max = (iw - margin) - (viewportWidth - lock);
        if (pixelPosX > min && pixelPosX < max){
            return lock - pixelPosX;
        }else if(pixelPosX <= min){
            return lock - min;
        }else{
            return lock - max;
        }
    }
    const pinchzoomChange = () => {
        x = pinchZoom.x; // x offset
        y = pinchZoom.y; // y offset
        scale = pinchZoom.scale; // scale
        allowImgScroll = (viewportWidth <= iWidth * scale);
        placePlane(plane, position, level);
    }
    
    if (position <= 0 || position >= 100) {
        // flight is not yet progress or finished
        scale = Math.min(viewportWidth/iWidth, maxHeight / (gInnerHeight + 50)); // we want the first 445px visible
        y = 0;
    } else {
        // flight is in progress
        scale = maxHeight / (gInnerHeight);  // (why extra 10 ?)
        y = - grametTop * scale;
    }
    if (viewportWidth > iWidth * scale) {
        x = (viewportWidth - (iWidth * scale)) / 2;
        allowImgScroll = false;
    } else {
        x = imageOffsetForPosition(position);
        allowImgScroll = true;
    }

    placePlane(plane, position, level);
    img.style.display = "block";
    pinchZoom.style.maxHeight = `${maxHeight}px`;
    pinchZoom.appendChild(img);
    pinchZoom.setTransform({scale, x, y});
    pinchZoom.addEventListener("change", pinchzoomChange);
    return {
        update({pos, fl}){
            position = parseFloat(pos);
            level = parseFloat(fl);
            if (allowImgScroll) {
                x = imageOffsetForPosition(position);
                pinchZoom.setTransform({x});
            }
            placePlane(plane, position, level);
        },
        destroy(){
            img.style.display = 'none';
            document.body.appendChild(img);
            pinchZoom.removeEventListener("change", pinchzoomChange);
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
