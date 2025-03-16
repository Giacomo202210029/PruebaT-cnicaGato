<template>
  <div class="carousel-container">
    <Carousel :value="books" :numVisible="4" :numScroll="2" :responsiveOptions="responsiveOptions" circular :autoplayInterval="3000">
      <template #item="slotProps">
        <div class="carousel-item">
          <div class="image-container">
            <img v-if="slotProps.data.cover_id"
                 :src="'https://covers.openlibrary.org/b/id/' + slotProps.data.cover_id + '-L.jpg'"
                 :alt="slotProps.data.title"
                 class="book-image" />
          </div>
          <div class="book-title">{{ slotProps.data.title }}</div>
          <div class="book-info">
            <div class="publish-year">{{ slotProps.data.first_publish_year }}</div>
          </div>
        </div>
      </template>
    </Carousel>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import BookService from "../services/BookService.js";

onMounted(async () => {
  try {
    const data = await BookService.getTrendingBooks();
    books.value = data.works.slice(0, 16).map(book => ({
      title: book.title,
      cover_id: book.cover_i || null,
      first_publish_year: book.first_publish_year
    }));
  } catch (error) {
    console.error("Error cargando libros:", error);
  }
});

const books = ref([]);
const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 4,
    numScroll: 1
  },
  {
    breakpoint: '5rem',
    numVisible: 4,
    numScroll: 1
  },
  {
    breakpoint: '767px',
    numVisible: 2,
    numScroll: 1
  },
  {
    breakpoint: '575px',
    numVisible: 1,
    numScroll: 1
  }
]);
</script>

<style scoped>
.carousel-container {
  width: 100%;
  padding: 20px;
  margin-bottom:-80rem;
}

.carousel-item {
  border-radius: 10px;
  padding: 16px;
  margin: 10px;
  text-align: center;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 26rem; /* Ajusta la altura en rem */
  width: 16rem; /* Ajusta el ancho en rem */
  overflow: hidden;
}

.book-image {
  width: 100%; /* Hace que la imagen ocupe el ancho completo del contenedor */
  height: 100%; /* Ajusta la altura proporcionalmente */
  object-fit: cover; /* Mantiene la proporción y cubre el espacio correctamente */
}
.book-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 10px;
}

.book-info {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

.publish-year {
  font-size: 1rem;
  font-weight: 600;
}
</style>