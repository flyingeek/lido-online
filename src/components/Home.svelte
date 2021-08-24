<script>
      import Logo from './Logo.svelte';
</script>
<Logo/>

<div class="row">
  <div class=" col-12 col-sm-6 col-md-6 col-xl-3"><div class="card feature avenza">
    <div class="card-header">COMPATIBLE OFFLINE</div>
    <div class="card-body">
      <p class="card-text">L'OFP ne quitte pas votre iPad ou votre ordinateur. Fonctionne avec les dernières technologies: PWA, Service Worker, fully responsive, cartes WebGL...</p>
    </div>
  </div></div>
  <div class="col-12 col-sm-6 col-md-6 col-xl-3"><div class="card feature mapsme">
    <div class="card-header">Multiples Projections</div>
    <div class="card-body">
      <p class="card-text">Des cartes LAMBERT conformes, un ATLAS politique, un ATLAS physique, une carte VFR et une MERCATOR avec 12 niveaux de zoom. Export en format KML vers Mapsme, Avenza ou Google Earth</p>
    </div>
  </div></div>
  <div class="col-12 col-sm-6 col-md-6 col-xl-3"><div class="card feature ogimet">
    <div class="card-header">Compatible avec Ogimet</div>
    <div class="card-body">
      <p class="card-text">Calcule une route pour ogimet et affiche le GRAMET qui est un météogramme combinant l'espace et le temps</p>
    </div>
  </div></div>
  <div class="col-12 col-sm-6 col-md-6 col-xl-3"><div class="card feature shortcuts">
    <div class="card-header">Compatible Raccourcis</div>
    <div class="card-body">
      <p class="card-text">Avec l'app Raccourcis, automatisez en récupérant le KML, le Gramet, ou une route Lido optimisée</p>
    </div>
  </div></div>
</div>
<div class="row">
  <div class="col">
    <div class="usage card">
      <div class="card-body">
        <h5 class="card-title">Utilisation&ThinSpace;:</h5>
        <p class="card-text">Dans Pilot Mission, onglet «Dossier de vol», affichez le PDF nommé "Dossier de vol OFP". Sur la gauche, cliquez sur le carré avec une flèche vers le haut. Choisissez «Enregistrer dans Fichiers». Dans l'app, c'est cet OFP qu'il faut ensuite sélectionner.</p>
      </div>
    </div>
  </div>
</div>
<style>
.usage {
  margin: 0 15px;
  background-color: rgba(var(--bs-light-rgb), 0.9);
  color: var(--bs-dark);
}
.feature{
  color: white;
  background-color: rgba(0, 0, 0, 0.2);
  margin: 15px;
  height: 100%;
}
.feature .card-header {
  font-variant-caps: all-small-caps;
  font-weight: bold;
  color: white;
}
.feature.shortcuts .card-header {
  background-color: var(--bs-purple);
}
.feature.mapsme .card-header {
  background-color: var(--bs-green);
}
.feature.avenza .card-header {
  background-color: var(--bs-pink);
}
.feature.ogimet .card-header {
  background-color: var(--bs-yellow);
}
.row {
  margin-bottom: 15px; /* for no ofp prompt */
  padding: 0 10px 10px 10px;
}
@media (min-width: 576px) and (max-width: 1199.8px) {
  .col-sm-6, .col-md-6 {
      margin-bottom: 15px;
  }
} 
@media (min-width: 1200px){
  .usage {
    margin-top: 5rem;
  }
} 
</style>