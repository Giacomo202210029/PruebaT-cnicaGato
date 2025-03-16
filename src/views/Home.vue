<script>
import bookService from "../services/BookService.js";
import MyCarousel from "../components/MyCarousel.vue";

export default {
  name: "Home.vue",
  components: {MyCarousel},
  data(){
    return{
      books: []
    }
  },
  methods: {
    async fetchBooks() {
      try {
        this.books = await bookService.getTrendingBooks();
        console.log(this.books);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    }
  },
  created() {
    this.fetchBooks();
  }
}

</script>

<template>
  <div class="home-container">
    <h1 class="title">📚 Open Library Book API</h1>
    <h3 class="subtitle">💗 Trending Right Now</h3>
     <h3 class="section-title">🔎 Search for Books</h3>
      <input type="text" placeholder="Enter book title..." class="search-input" />
      <button class="search-button">Search</button>
    <MyCarousel />
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  margin-top:-24rem;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  color: var( #4A90E2);
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  color: var( #FF4081);
  margin-bottom: 2rem;
}



</style>