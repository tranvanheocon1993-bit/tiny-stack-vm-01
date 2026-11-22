// Tiny stack VM (ISA v1): one run answers every program in /input.
// Node 22, stdlib only. Each /output/<id>/ gets stdout.bin + exit.txt.
import {mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
// Opcode table, one char per byte 0x00..0x53: charCode-33 packs
// imm*16+pops*4+pushes; ' ' (32) marks an unknown opcode.
const T='!2b%\'+,0        *******&***&*** ***             AEEA!           &)              %%\"%';
const E=new TextEncoder();
function run(p,q){
 const n=p.length,D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536);
 let sp=0,cp=0,ol=0,ip=0,pc=0,st=0;
 const done=e=>[o.slice(0,ol),e];
 for(;;){
  if(st===1e6)return done(10);
  if(pc<0||pc>=n)return done(9);
  const b=p[pc],c=b<84?T.charCodeAt(b):0;
  if(!c||c<33)return done(5);
  const v=c-33,im=v>>4,po=v>>2&3,pu=v&3;
  if(pc+im>=n)return done(9);
  st++;
  const nx=pc+1+im;
  if(sp<po)return done(2);
  if(sp-po+pu>256)return done(3);
  pc=nx;
  switch(b){
   case 0:return done(0);
   case 1:D[sp++]=(p[nx-1]<<24)>>24;break;
   case 2:D[sp++]=p[nx-4]|p[nx-3]<<8|p[nx-2]<<16|p[nx-1]<<24;break;
   case 3:sp--;break;
   case 4:D[sp]=D[sp-1];sp++;break;
   case 5:{const t=D[sp-1];D[sp-1]=D[sp-2];D[sp-2]=t;break;}
   case 6:D[sp]=D[sp-2];sp++;break;
   case 7:{const a=D[sp-3];D[sp-3]=D[sp-2];D[sp-2]=D[sp-1];D[sp-1]=a;break;}
   case 23:D[sp-1]=-D[sp-1]|0;break;
   case 27:D[sp-1]=~D[sp-1];break;
   case 48:case 49:case 50:{
    const r=(p[nx-2]|p[nx-1]<<8)<<16>>16;
    let t=b===48;
    if(b!==48){const v=D[--sp];t=b===49?v===0:v!==0;}
    if(t)pc=nx+r;
    break;}
   case 51:
    if(cp===64)return done(7);
    C[cp++]=nx;pc=p[nx-2]|p[nx-1]<<8;break;
   case 52:
    if(!cp)return done(8);
    pc=C[--cp];break;
   case 64:{
    const a=D[sp-1];
    if(a<0||a>255)return done(6);
    D[sp-1]=M[a];break;}
   case 65:{
    const a=D[sp-1],v=D[sp-2];
    if(a<0||a>255)return done(6);
    sp-=2;M[a]=v;break;}
   case 80:{
    const s=E.encode(String(D[sp-1]));
    if(ol+s.length>65536)return done(11);
    sp--;o.set(s,ol);ol+=s.length;break;}
   case 81:
    if(ol+1>65536)return done(11);
    o[ol++]=D[--sp]&255;break;
   case 82:D[sp++]=ip<q.length?q[ip++]:-1;break;
   case 83:return done(D[--sp]&255);
   default:{
    const y=D[sp-1],x=D[sp-2];let r;
    if(b===16)r=x+y|0;
    else if(b===17)r=x-y|0;
    else if(b===18)r=Math.imul(x,y);
    else if(b===19){if(!y)return done(4);r=x===-2147483648&&y===-1?x:(x/y)|0;}
    else if(b===20){if(!y)return done(4);r=y===-1?0:x%y|0;}
    else if(b===21){if(!y)return done(4);r=Math.floor((x>>>0)/(y>>>0))|0;}
    else if(b===22){if(!y)return done(4);r=(x>>>0)%(y>>>0)|0;}
    else if(b===24)r=x&y;
    else if(b===25)r=x|y;
    else if(b===26)r=x^y;
    else if(b===28)r=x<<(y&31);
    else if(b===29)r=x>>(y&31);
    else if(b===30)r=(x>>>(y&31))|0;
    else if(b===32)r=x===y?1:0;
    else if(b===33)r=x<y?1:0;
    else r=(x>>>0)<(y>>>0)?1:0;
    sp-=2;D[sp++]=r;}
  }
 }
}
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(const id of readdirSync(I).sort()){
 const[r,e]=run(readFileSync(join(I,id,'program.bin')),readFileSync(join(I,id,'input.bin')));
 mkdirSync(join(O,id),{recursive:true});
 writeFileSync(join(O,id,'stdout.bin'),r);
 writeFileSync(join(O,id,'exit.txt'),e+'\n');
}
