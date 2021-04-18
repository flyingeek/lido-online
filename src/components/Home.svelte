<script>
      import Logo from './Logo.svelte';
</script>
<Logo/>
<div class="row">
  <div class="card-deck">
    <div class=" col-12 col-sm-6 col-md-6 col-xl-3"><div class="card avenza">
      <div class="card-header">COMPATIBLE OFFLINE</div>
      <div class="card-body">
        <p class="card-text">L'OFP ne quitte pas votre iPad ou votre ordinateur. Fonctionne avec les dernières technologies: PWA, Service Worker, fully responsive, cartes WebGL...</p>
      </div>
    </div></div>
    <div class="col-12 col-sm-6 col-md-6 col-xl-3"><div class="card mapsme">
      <div class="card-header">Multiples Projections</div>
      <div class="card-body">
        <p class="card-text">Des cartes LAMBERT conformes, un ATLAS politique, un ATLAS physique, et une MERCATOR avec 12 niveaux de zoom. Export en format KML vers Mapsme ou Avenza</p>
      </div>
    </div></div>
    <div class="col-12 col-sm-6 col-md-6 col-xl-3"><div class="card ogimet">
      <div class="card-header">Compatible avec Ogimet</div>
      <div class="card-body">
        <p class="card-text">Calcule une route pour ogimet et affiche le GRAMET qui est un météogramme combinant l'espace et le temps</p>
      </div>
    </div></div>
    <div class="col-12 col-sm-6 col-md-6 col-xl-3"><div class="card shortcuts">
      <div class="card-header">Compatible Raccourcis</div>
      <div class="card-body">
        <p class="card-text">Avec l'app Raccourcis, automatisez en récupérant le KML, le Gramet, ou une route Lido optimisée</p>
      </div>
    </div></div>
  </div>
</div>
<style>

.card {
  color: white;
  background-color: rgba(0, 0, 0, 0.2);
  margin: 15px;
  height: 100%;
}
.card-header {
  font-variant-caps: all-small-caps;
  font-weight: bold;
  color: white;
}
.shortcuts .card-header {
  background-color: var(--purple);
}
.mapsme .card-header {
  background-color: var(--green);
}
.avenza .card-header {
  background-color: var(--pink);
}
.ogimet .card-header {
  background-color: var(--yellow);
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
</style>