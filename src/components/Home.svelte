<script>
      import Logo from './Logo.svelte';
</script>
<Logo/>

<div class="row">
  <div class="col-12 col-lg-4">
    <div class="card feature usage">
      <div class="card-header">Facile à utiliser</div>
      <div class="card-body">
        <p class="card-text">Dans <b>Pilot Mission</b>, onglet <b>Dossier de vol</b>, affichez le PDF nommé <b>Dossier de vol OFP</b>. Sur la gauche, cliquez sur le carré avec une flèche vers le haut. Choisissez <b>Enregistrer dans Fichiers</b>. Dans l'app, c'est cet OFP qu'il faut sélectionner.</p>
      </div>
    </div>
  </div>
  <div class="col-12 col-lg-4"><div class="card feature offline">
    <div class="card-header">RAPIDE ET OFFLINE</div>
    <div class="card-body">
      <p class="card-text">L'OFP ne quitte pas votre iPad ou votre ordinateur. Conçu pour le PilotPad, peut s'utiliser en vol sans réseau et fonctionne avec les dernières technologies: PWA, Service Worker, fully responsive, cartes WebGL...</p>
    </div>
  </div></div>
  <div class="col-12 col-lg-4"><div class="card feature maps">
    <div class="card-header">Multiples Projections</div>
    <div class="card-body">
      <ul class="card-text">
        <li>trois LAMBERT conformes</li>
        <li>un ATLAS POLITIQUE</li>
        <li>un ATLAS PHYSIQUE</li>
        <li>une carte VFR</li>
        <li>une MERCATOR (zoom x 12)</li>
      </ul>
      <p class="card-text">Export KML compatible Mapsme, Avenza et Google Earth.</p>
    </div>
  </div></div>
</div>

<style>
/* .usage {
  margin: 0 15px;
  color: white;
  background-color: rgba(0, 0, 0, 0.2);
} */
.usage .card-header {
  background-color: var(--bs-green);
}
.feature{
  color: black;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  margin: 1rem 0;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-size: 108%;
}
.feature .card-header {
  font-variant-caps: all-small-caps;
  font-weight: bold;
  color: white;
}
.feature.offline  .card-header{
  background-color: var(--bs-purple);
}
/* .feature.mapsme .card-header {
  background-color: var(--bs-green);
} */
.feature.maps .card-header {
  background-color: var(--bs-pink);
}
/* .feature.ogimet .card-header {
  background-color: var(--bs-yellow);
} */
.row {
  margin-bottom: 1rem; /* for no ofp prompt */
  padding: 0 1rem 1rem 1rem;
}
ul {
  list-style: square;
}
b, li {
  white-space: nowrap;
}
@media (min-width: 992px){
  .row {
    margin-top: 2rem;
  }
  .feature {
    height: 100%;
  }
}
</style>
