import {culture} from '../src/core.js';
import {World} from '../src/world.js';

const args=process.argv.slice(2);
const value=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:Number(args[i+1]);};
const seeds=value('--seeds',5),rounds=value('--rounds',60000),ticks=value('--ticks',3000);
if(![seeds,rounds,ticks].every(Number.isInteger)||seeds<1||seeds>100||rounds<0||ticks<0)throw new Error('Use --seeds 1..100, --rounds nonnegative integer, --ticks nonnegative integer');
const output={version:1,description:'Stationary culture and spatial ecology are separate experiments.',settings:{seeds,rounds,ticks},culture:[],ecology:[]};
for(let seed=1;seed<=seeds;seed++){
  output.culture.push({adaptive:culture({seed,rounds}),frozen:culture({seed,rounds,learning:false})});
  for(const learning of [true,false]){
    const w=new World({seed,learning});
    const trajectory=[{...w.stats(),...w.assay()}];
    while(w.tick<ticks){w.step(Math.min(500,ticks-w.tick));trajectory.push({...w.stats(),...w.assay()});}
    output.ecology.push({seed,learning,trajectory});
  }
  console.error(`Completed seed ${seed}/${seeds}`);
}
console.log(JSON.stringify(output,null,2));
