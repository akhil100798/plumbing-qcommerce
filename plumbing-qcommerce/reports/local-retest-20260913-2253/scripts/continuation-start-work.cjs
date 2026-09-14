module.exports=async c=>{const p=c.pages.plumber;await p.getByRole('button',{name:'Confirm Arrival',exact:true}).click();await c.snap('plumber','start-work');c.flush();};
