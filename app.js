const search=document.querySelector('#search');if(search){let category='All';const cards=[...document.querySelectorAll('.project')];const grid=document.querySelector('.project-grid');function update(){let count=0;cards.forEach(c=>{c.hidden=!((category==='All'||c.dataset.category===category)&&c.textContent.toLowerCase().includes(search.value.toLowerCase()));if(!c.hidden)count++});document.querySelector('#empty').hidden=count>0}search.addEventListener('input',update);document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});update()}));document.querySelector('#sort').addEventListener('change',e=>{cards.sort((a,b)=>e.target.value==='az'?a.dataset.title.localeCompare(b.dataset.title):a.dataset.order.localeCompare(b.dataset.order)).forEach(c=>grid.append(c))});document.querySelector('#layout').addEventListener('click',e=>{const list=grid.classList.toggle('list');e.target.textContent=list?'Grid view':'List view';e.target.setAttribute('aria-pressed',String(list))})}

// Reveal content once, without hiding anything when reduced motion is requested.
if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}},{threshold:0.05});
 document.querySelectorAll('.exam-card,.study-topic,.reference,.credential,.focus-grid article').forEach((element,index)=>{element.style.setProperty('--reveal-delay',`${Math.min(index%2,1)*70}ms`);element.classList.add('reveal-ready');observer.observe(element)});
 window.addEventListener('beforeprint',()=>document.querySelectorAll('.reveal-ready').forEach(e=>e.classList.add('is-visible')));
}

// Local practice rounds: instant feedback, no network request required.
document.querySelectorAll('.practice-question').forEach(question=>{
 const button=question.querySelector('.practice-check');
 const result=question.querySelector('.practice-result');
 button?.addEventListener('click',()=>{
  const selected=question.querySelector('input:checked');
  question.classList.add('answered');
  if(!selected){result.textContent='Choose an answer first.';result.className='practice-result incorrect';return}
  const correct=selected.value===question.dataset.answer;
  result.textContent=correct?'Correct — your reasoning matches the study note.':'Not quite — review the explanation below and try the idea again.';
  result.className=`practice-result ${correct?'correct':'incorrect'}`;
 });
});

// The decorative swing is opt-in through JS so a pause control is always usable.
const identityCard=document.querySelector('.identity-panel');
if(identityCard){
 const motionButton=document.createElement('button');
 motionButton.type='button';
 motionButton.className='card-motion-toggle';
 motionButton.setAttribute('aria-label','Pause card animation');
 motionButton.setAttribute('aria-pressed','false');
 motionButton.title='Pause card animation';
 motionButton.textContent='Ⅱ';
 motionButton.addEventListener('click',()=>{
  const paused=identityCard.dataset.motionPaused!=='true';
  identityCard.dataset.motionPaused=String(paused);
  motionButton.setAttribute('aria-pressed',String(paused));
  motionButton.setAttribute('aria-label',paused?'Resume card animation':'Pause card animation');
  motionButton.title=paused?'Resume card animation':'Pause card animation';
  motionButton.textContent=paused?'▶':'Ⅱ';
 });
 identityCard.append(motionButton);
 identityCard.classList.add('swing-ready');
}
