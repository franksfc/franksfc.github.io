var posts=["2024/01/02/hello-world/","2024/01/04/jing-ti-lei-xing-fu-xi/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };