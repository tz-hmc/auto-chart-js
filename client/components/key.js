const PIXELS_PER_NOTE = 45;
const DEFAULT_RADIUS = 12;
// for left arrow
const arrWidth = 108;
const arrHeight = 86;
const xOffset = arrWidth/2;
const yOffset = arrHeight/2;

const rightArrowPath = "M232,61.7c-23.7,23.6-23.7,62,0,85.7l48,48H60.6C27.1,195.4,0,222.5,0,256c0,33.4,27.1,60.6,60.6,60.6h219.5l-48,48   c-23.7,23.6-23.7,62,0,85.7c11.8,11.8,27.3,17.8,42.8,17.8c15.5,0,31-5.9,42.8-17.8L512,256L317.7,61.7C294,38,255.7,38,232,61.7z";
const downArrowPath = "M450.3,232c-23.7-23.7-62-23.7-85.7,0L316.6,280V60.6C316.6,27.1,289.4,0,256,0c-33.5,0-60.6,27.1-60.6,60.6V280L147.4,232   c-23.7-23.7-62-23.7-85.7,0c-23.7,23.7-23.7,62,0,85.7L256,512l194.3-194.3C474,294,474,255.7,450.3,232z";
const leftArrowPath = "M451.4,195.4H231.9l48-48c23.7-23.7,23.7-62.1,0-85.7c-23.7-23.7-62-23.7-85.7,0L0,256l194.3,194.3   c11.8,11.8,27.3,17.8,42.8,17.8c15.5,0,31-5.9,42.8-17.8c23.7-23.7,23.7-62.1,0-85.7l-48-48h219.5c33.4,0,60.6-27.1,60.6-60.6   C512,222.5,484.9,195.4,451.4,195.4z";
const upArrowPath = "M256,0L61.7,194.3C38,218,38,256.4,61.7,280c23.7,23.7,62,23.7,85.7,0l48.1-48.1v219.4c0,33.4,27.1,60.6,60.6,60.6   c33.4,0,60.6-27.1,60.6-60.6V232l48.1,48.1c11.9,11.9,27.3,17.8,42.8,17.8c15.5,0,31-5.9,42.8-17.8c23.7-23.7,23.7-62,0-85.7L256,0   z";

const leftArrowOutlinePath = "M245,467.7c-21.2,0-41.2-8.3-56.2-23.3L0,255.6L188.8,66.9c30-30.1,82.4-30.1,112.5,0c15,14.9,23.3,34.9,23.3,56.2   c0,19.8-7.2,38.5-20.3,53.1h128.2c43.8,0,79.5,35.7,79.5,79.5c0,43.9-35.7,79.5-79.5,79.5H304.3c13.1,14.5,20.3,33.2,20.3,53   c0.1,21.3-8.3,41.3-23.3,56.3C286.2,459.4,266.2,467.7,245,467.7z M75,255.6l151.3,151.3c10,10,27.4,10,37.5,0   c5-5,7.8-11.7,7.8-18.8c0-7.1-2.8-13.7-7.7-18.7l-87.3-87.3h256c14.6,0,26.5-11.9,26.5-26.5c0-14.6-11.9-26.5-26.5-26.5h-256   l87.3-87.3c5-5,7.8-11.7,7.8-18.8c0-7.1-2.8-13.7-7.7-18.7c-10.1-10.1-27.5-10-37.5,0L75,255.6z";
const upArrowOutlinePath = "M256,512c-44,0-79.8-35.8-79.8-79.8V305.4c-30.4,27.2-80.5,26-109.7-3.1c-31.1-31.1-31.1-81.8,0-112.9L256,0l189.5,189.5   c31.1,31.1,31.1,81.8,0,112.9c-29.1,29.1-79.3,30.3-109.7,3.1v126.8C335.8,476.2,300,512,256,512z M229.4,177.1v255.1   c0,14.7,11.9,26.6,26.6,26.6c14.7,0,26.6-12,26.6-26.6V177.1l87.6,87.6c10.1,10.1,27.5,10.1,37.6,0c10.4-10.4,10.4-27.2,0-37.6   L256,75.3L104.1,227.1c-10.4,10.4-10.4,27.2,0,37.6c10.1,10.1,27.5,10.1,37.6,0L229.4,177.1z";
const downArrowOutlinePath = "M256,512L67.2,323.2c-31-31-31-81.5,0-112.5c29-29,79-30.2,109.3-3V79.5C176.5,35.7,212.2,0,256,0s79.5,35.7,79.5,79.5   v128.2c30.3-27.1,80.3-26,109.3,3c31,31,31,81.5,0,112.5L256,512z M123.4,240.5c-7.1,0-13.7,2.8-18.7,7.8   c-10.4,10.3-10.4,27.1,0,37.5L256,437l151.3-151.3c10.4-10.4,10.4-27.1,0-37.5c-10-10-27.4-10-37.5,0l-87.3,87.3v-256   c0-14.6-11.9-26.5-26.5-26.5s-26.5,11.9-26.5,26.5v256l-87.3-87.3C137.2,243.2,130.5,240.5,123.4,240.5z";
const rightArrowOutlinePath = "M267,467.7c-21.2,0-41.2-8.3-56.2-23.3c-15-15-23.3-35-23.3-56.3c0-19.8,7.2-26.5,20.3-53H79.5C35.7,335.1,0,299.4,0,255.6   c0-43.8,35.7-79.5,79.5-79.5h128.2c-13.1-26.5-20.3-33.3-20.3-53c0-21.3,8.3-41.2,23.3-56.2c30-30,82.4-30,112.4,0L512,255.6   L323.2,444.4C308.2,459.4,288.2,467.7,267,467.7z M79.5,229.1C64.9,229.1,53,241,53,255.6c0,14.6,11.9,26.5,26.5,26.5h256   l-87.3,87.3c-5,5-7.8,11.6-7.8,18.7c0,7.1,2.8,13.8,7.8,18.8c10,10,27.4,10,37.5,0L437,255.6L285.7,104.3c-10-10-27.4-10-37.5,0   c-5,5-7.8,11.6-7.8,18.7c0,7.1,2.8,13.8,7.8,18.8l87.3,87.3H79.5z";

const FILL_COLOR_LIGHT ='#ffffff';
const NOTE_COLOR_OUTLINE = '#fefefe';

const KEY_COLOR = '#333333';

class Key {
    constructor(svgPath, keySvgPath, keyCode, color, longNoteColor, keyColor, outlineColor, xOff, yOff) { 
        this.svgPath = new Path2D(svgPath);
        this.keySvgPath = new Path2D(keySvgPath);
        this.keyCode = keyCode;
        this.color = color;
        this.longNoteColor = longNoteColor;
        this.keyColor = keyColor;
        this.outlineColor = outlineColor;
        this.xOff = xOff;
        this.yOff = yOff;
    }
    drawKey(context, centerX, centerY, fillLight=false) {
        context.save();
        context.translate(centerX-this.xOff, centerY-this.yOff);
        context.scale(0.2, 0.2);
        if (fillLight) {
            context.fillStyle = FILL_COLOR_LIGHT;
            context.fill(this.keySvgPath);
            context.strokeStyle = this.color;
            context.lineWidth = 5;
            context.stroke(this.keySvgPath);
        } else {
            context.fillStyle = this.keyColor;
            context.fill(this.keySvgPath);
        }
        
        context.restore();
    }
    drawNote(context, centerX, centerY) {
        context.save();
        context.translate(centerX-this.xOff, centerY-this.yOff);
        context.scale(0.2, 0.2);
        context.fillStyle = this.color;
        context.fill(this.svgPath);
        context.strokeStyle = this.outlineColor;
        context.lineWidth = 10;
        context.stroke(this.svgPath);
        // context.strokeStyle = this.lightOutline;
        // context.lineWidth = 4;
        // context.stroke(this.svgPath);
        context.restore();
    }
    drawLongNote(context, centerX, centerY, noteLength) {
        this.drawNote(context, centerX, centerY);
        const top = centerY+DEFAULT_RADIUS;
        const bottom = top+PIXELS_PER_NOTE*noteLength;
        context.beginPath();
        context.moveTo(centerX, top);
        context.lineTo(centerX, bottom);
        context.lineCap = 'round';
        context.strokeStyle = this.longNoteColor;
        context.lineWidth = 2*DEFAULT_RADIUS;
        context.stroke();
        context.closePath();
        // let roundRect = new Path2D();
        // let height = PIXELS_PER_NOTE*noteLength-(2*DEFAULT_RADIUS);
        // let left = centerX-DEFAULT_RADIUS,
        //     right = centerX+DEFAULT_RADIUS,
        //     top = centerY-DEFAULT_RADIUS,
        //     bottom = centerY+DEFAULT_RADIUS+height;
        // roundRect.moveTo(right, bottom);
        // roundRect.arcTo(left, bottom, left, top, DEFAULT_RADIUS);
        // roundRect.arcTo(left, top, right, top, DEFAULT_RADIUS);
        // roundRect.arcTo(right, top, right, bottom, DEFAULT_RADIUS);
        // roundRect.arcTo(right, bottom, left, bottom, DEFAULT_RADIUS);
        // context.fillStyle = this.longNoteColor;
        // context.fill(roundRect);
    }
}

const defaultKeys = [
    new Key(leftArrowPath, leftArrowOutlinePath, 37, "rgb(144, 0, 255)", "rgb(144, 0, 255, 0.7)", "rgb(255, 255, 255, 0.5)", "rgb(0, 0, 255, 0.7)", xOffset, yOffset),
    new Key(downArrowPath, downArrowOutlinePath, 40, "rgb(0, 0, 255)", "rgb(0, 0, 255, 0.7)", "rgb(255, 255, 255, 0.5)", "rgb(144, 0, 255, 0.7)", xOffset, yOffset),
    new Key(upArrowPath, upArrowOutlinePath, 38, "rgb(255, 0, 44)", "rgb(255, 0, 44, 0.7)", "rgb(255, 255, 255, 0.5)", "rgb(144, 0, 255, 0.7)", xOffset, yOffset),
    new Key(rightArrowPath, rightArrowOutlinePath, 39, "rgb(0, 255, 135)", "rgb(0, 255, 135, 0.7)", "rgb(255, 255, 255, 0.5)", "rgb(144, 0, 255, 0.7)", xOffset, yOffset)
];