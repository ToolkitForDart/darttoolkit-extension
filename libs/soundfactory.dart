// TODO honor 'repeat' and add 'volume/pan' support
Sound _playSound(String sndId, [int repeat]) {
  resources.getSound(sndId).play();
}
