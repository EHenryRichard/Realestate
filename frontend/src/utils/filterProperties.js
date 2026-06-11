const normalize = (value = "") => value.toString().trim().toLowerCase();

export const filterProperties = (properties = [], filters = {}) => {
  const search = normalize(filters.search);
  const type = normalize(filters.type);
  const status = normalize(filters.status);
  const location = normalize(filters.location);
  const sort = filters.sort || "featured";

  const filtered = properties.filter((property) => {
    const searchableText = normalize(
      `${property.title} ${property.location} ${property.type} ${property.status} ${property.description}`,
    );

    const matchesSearch = !search || searchableText.includes(search);
    const matchesType = !type || normalize(property.type) === type;
    const matchesStatus = !status || normalize(property.status) === status;
    const matchesLocation = !location || normalize(property.location).includes(location);

    return matchesSearch && matchesType && matchesStatus && matchesLocation;
  });

  return [...filtered].sort((first, second) => {
    if (sort === "price-low") {
      return first.price - second.price;
    }

    if (sort === "price-high") {
      return second.price - first.price;
    }

    if (sort === "newest") {
      return new Date(second.updatedAt) - new Date(first.updatedAt);
    }

    return Number(second.featured) - Number(first.featured);
  });
};

export const getPropertyFilterOptions = (properties = []) => ({
  types: [...new Set(properties.map((property) => property.type).filter(Boolean))],
  statuses: [...new Set(properties.map((property) => property.status).filter(Boolean))],
  locations: [...new Set(properties.map((property) => property.location).filter(Boolean))],
});
