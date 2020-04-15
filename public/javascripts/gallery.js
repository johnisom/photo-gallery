$(() => {
  const $slides = $('#slides');
  const $photoInfo = $('section > header');
  const $photoComments = $('#comments > ul');
  const $prev = $('a.prev');
  const $next = $('a.next');
  const $form = $('form[method=post]');
  const photosHTML = $('#photos').remove().html();
  const photoCommentsHTML = $('#photo_comments').remove().html();
  const photoInformationHTML = $('#photo_information').remove().html();
  const photoCommentHTML = $('#photo_comment').remove().html();
  const photosTemplate = Handlebars.compile(photosHTML);
  const photoCommentsTemplate = Handlebars.compile(photoCommentsHTML);
  const photoInformationTemplate = Handlebars.compile(photoInformationHTML);
  const photoCommentTemplate = Handlebars.compile(photoCommentHTML);

  let comments = {};
  let photos = {};
  let currentPhotoId;

  Handlebars.registerPartial('comment', photoCommentHTML);

  const writeComments = function writeComments(id) {
    $photoComments.html(photoCommentsTemplate({ comments: comments[id] }));
  };

  const writePhotoInfo = function writePhotoInfo(id) {
    $photoInfo.html(photoInformationTemplate(photos[id]));
  };

  const writePhotos = function writePhotos(photosObj) {
    $slides.html(photosTemplate({ photos: Object.values(photos) }));
  };

  const fillComments = function fillComments(photoId) {
    if (comments[photoId]) {
      writeComments(photoId);
      return;
    }

    $.get(`/comments?photo_id=${photoId}`).done((commentsObj) => {
      comments[photoId] = commentsObj;
      writeComments(photoId);
    });
  };

  const likePhoto = function likePhoto(photoId, total) {
    const $likeButton = $photoInfo.find('.actions a.like');

    photos[photoId].likes = total;
    $likeButton.html($likeButton.html().replace(/\d+/, total));
  };

  const favoritePhoto = function favoritePhoto(photoId, total) {
    const $favoriteButton = $photoInfo.find('.actions a.favorite');

    photos[photoId].favorites = total;
    $favoriteButton.html($favoriteButton.html().replace(/\d+/, total));
  };

  $prev.on('click', (e) => {
    e.preventDefault();

    const photoIds = Object.keys(photos);
    const photoVals = Object.values(photos);
    const photo = $(photoVals).get(
      (photoIds.indexOf(currentPhotoId.toString()) - 1) % photoIds.length
    );

    $slides.find(`[data-id=${currentPhotoId}]`).fadeOut();
    writePhotoInfo(photo.id);
    fillComments(photo.id);
    $slides.find(`[data-id=${photo.id}]`).fadeIn();

    currentPhotoId = photo.id;
    $form.find('input[name=photo_id]').val(currentPhotoId);
  });

  $next.on('click', (e) => {
    e.preventDefault();

    const photoIds = Object.keys(photos);
    const photoVals = Object.values(photos);
    const photo = $(photoVals).get(
      (photoIds.indexOf(currentPhotoId.toString()) + 1) % photoIds.length
    );

    $slides.find(`[data-id=${currentPhotoId}]`).fadeOut();
    writePhotoInfo(photo.id);
    fillComments(photo.id);
    $slides.find(`[data-id=${photo.id}]`).fadeIn();

    currentPhotoId = photo.id;
    $form.find('input[name=photo_id]').val(currentPhotoId);
  });

  $photoInfo.on('click', '.actions a', function(e) {
    e.preventDefault();

    const photoId = this.dataset.id;
    const data = `photo_id=${photoId}`;

    switch (this.dataset.property) {
    case 'likes':
      $.post('/photos/like', data).done(({ total }) => {
        likePhoto(photoId, total);
      });
      break;
    case 'favorites':
      $.post('/photos/favorite', data).done(({ total }) => {
        favoritePhoto(photoId, total);
      });
      break;
    }
  });

  $form.on('submit', (e) => {
    e.preventDefault();

    $.post($form.attr('action'), $form.serialize()).done((commentObj) => {
      $photoComments.append(photoCommentTemplate(commentObj));
      $form.trigger('reset');
    });
  });

  $.get('/photos').done((photosObj) => {
    photosObj.forEach((photo) => {
      photos[photo.id] = photo;
      if (currentPhotoId === undefined) {
        currentPhotoId = photo.id;
      }
    });

    writePhotos();
    writePhotoInfo(currentPhotoId);
    fillComments(currentPhotoId);
  });
});
