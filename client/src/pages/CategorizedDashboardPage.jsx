/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/NavBar";
import ProjectCard from "../components/ProjectCard";
import FilterSidebar from "../components/FilterSidebar";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import EmptyState from "../components/EmptyState";
import SubscriptionStatus from "../components/payment/SubscriptionStatus";
import { usePayment } from "../context/PaymentContext";

// ===== Constants =====
const ITEMS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_DELAY = 500;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ===== Project Categories =====
const PROJECT_CATEGORIES = [
  {
    id: "basic",
    name: "Basic Projects",
    description: "Perfect for building your resume and gaining practice",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  {
    id: "funded",
    name: "Funded Projects",
    description: "Bid on projects and get selected by project owners",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    id: "capsule",
    name: "Capsule Projects",
    description: "Advanced company projects - Coming Soon",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    comingSoon: true
  }
];

// ===== Utilities =====
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// Build a stable query key from primitives (avoids object ref churn)
const useQueryKey = (search, filters, page, category) =>
  useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(ITEMS_PER_PAGE));
    if (search) params.set("search", search);
    if (filters.techStack) params.set("techStack", filters.techStack);
    if (filters.budget) params.set("budget", filters.budget);
    if (filters.contributor) params.set("contributor", filters.contributor);
    if (category) params.set("category", category);
    return params.toString();
  }, [search, filters.techStack, filters.budget, filters.contributor, page, category]);

// ===== Data Hook (infinite projects) =====
const useInfiniteProjects = (searchTerm, filters, category) => {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Reset when inputs change
  useEffect(() => {
    setProjects([]);
    setTotal(0);
    setHasMore(true);
    setPage(1);
    setError(null);
    setLoading(true);
  }, [searchTerm, filters.techStack, filters.budget, filters.contributor, category]);

  const queryKeyInitial = useQueryKey(searchTerm, filters, 1, category);

  // Initial fetch with cancellation to prevent race conditions
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchInitial = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(
          `${API_BASE_URL}/api/project/getlistproject?${queryKeyInitial}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            signal: controller.signal,
          }
        );

        if (cancelled) return;

        const list = res.data?.projects ?? [];
        const totalCount = Number(res.data?.total ?? 0);
        setProjects(list);
        setTotal(totalCount);

        // hasMore: prefer total vs fetched-so-far
        const nextHasMore = list.length > 0 && list.length < totalCount;
        setHasMore(nextHasMore);
        setPage(2);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        setError(err?.response?.data?.message || "Failed to fetch projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitial();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [queryKeyInitial]);

  const queryKeyMore = useQueryKey(searchTerm, filters, page, category);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const controller = new AbortController();
    try {
      setLoadingMore(true);

      const res = await axios.get(
        `${API_BASE_URL}/api/project/getlistproject?${queryKeyMore}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          signal: controller.signal,
        }
      );

      const list = res.data?.projects ?? [];
      const totalCount = Number(res.data?.total ?? total);

      // Merge by id to avoid accidental duplicates
      setProjects((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        const merged = [...prev];
        for (const p of list) {
          if (!seen.has(p._id)) merged.push(p);
        }
        return merged;
      });
      setTotal(totalCount);

      const nextPage = page + 1;
      setPage(nextPage);

      // hasMore using totals
      const fetchedSoFar = (page - 1) * ITEMS_PER_PAGE + list.length;
      const stillMore = fetchedSoFar < totalCount && list.length > 0;
      setHasMore(stillMore);
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError") return;
      // Soft-fail loadMore; don't crash UI
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, queryKeyMore, page, total]);

  return {
    data: { projects, total, hasMore },
    loading,
    loadingMore,
    error,
    loadMore,
  };
};

// ===== Category Tab Component =====
const CategoryTab = ({ category, isActive, onClick, projectCount }) => {
  const { name, description, icon, color, bgColor, borderColor, comingSoon } = category;
  
  return (
    <button
      onClick={onClick}
      disabled={comingSoon}
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-300 text-left w-full
        ${isActive 
          ? `${bgColor} ${borderColor} border-opacity-50 shadow-lg` 
          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
        }
        ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}
      `}
    >
      <div className="flex items-start space-x-4">
        <div className={`
          p-3 rounded-lg ${isActive ? `bg-gradient-to-r ${color}` : 'bg-gray-700'}
          transition-colors duration-300
        `}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            {comingSoon && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
          {!comingSoon && (
            <div className="mt-2 text-xs text-gray-500">
              {projectCount} project{projectCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

// ===== Page =====
const CategorizedDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("funded");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState({
    techStack: searchParams.get("techStack") || "",
    budget: searchParams.get("budget") || "",
    contributor: searchParams.get("contributor") || "",
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Debounce
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_DELAY);

  // Keep URL in sync (only when actually changed)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.techStack) params.set("techStack", filters.techStack);
    if (filters.budget) params.set("budget", filters.budget);
    if (filters.contributor) params.set("contributor", filters.contributor);
    if (activeCategory) params.set("category", activeCategory);

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    filters.techStack,
    filters.budget,
    filters.contributor,
    activeCategory,
    searchParams,
    setSearchParams,
  ]);

  // Data
  const { data, loading, loadingMore, error, loadMore } = useInfiniteProjects(
    debouncedSearch,
    filters,
    activeCategory
  );

  // Intersection Observer (preload slightly before bottom)
  const observerRef = useRef(null);
  const lastProjectRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && data.hasMore) {
            loadMore();
          }
        },
        { root: null, rootMargin: "400px 0px", threshold: 0.01 }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, data.hasMore, loadMore]
  );

  // Handlers
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value || "" }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setFilters({ techStack: "", budget: "", contributor: "" });
  }, []);

  const toggleMobileFilter = useCallback(() => {
    setMobileFilterOpen((p) => !p);
  }, []);

  const handleCategoryChange = useCallback((categoryId) => {
    setActiveCategory(categoryId);
  }, []);

  const currentCategory = PROJECT_CATEGORIES.find(cat => cat.id === activeCategory);

  return (
    <ErrorBoundary>
      <div className="min-h-dvh bg-[#121212] text-white flex flex-col">
        {/* Navigation */}
        <Navbar />

        {/* OUTER SPLIT: prevent this from scrolling */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Mobile Filter Toggle */}
          <button
            onClick={toggleMobileFilter}
            className="lg:hidden mx-4 mt-4 mb-4 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-3 px-4 rounded-lg flex items-center justify-between w-full shadow-lg hover:shadow-xl transition-all duration-300"
            aria-label="Toggle filters"
            aria-expanded={mobileFilterOpen}
          >
            <span className="font-medium">Filter Projects</span>
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${mobileFilterOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* SIDEBAR: its own scroll on large screens; doesn't cause main to scroll */}
          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto lg:w-80 lg:flex-shrink-0">
            <div className="p-4">
              {/* Subscription Status */}
              <div className="mb-6">
                <SubscriptionStatus />
              </div>
              
              {/* Category Tabs */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Project Categories</h2>
                <div className="space-y-3">
                  {PROJECT_CATEGORIES.map((category) => (
                    <CategoryTab
                      key={category.id}
                      category={category}
                      isActive={activeCategory === category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      projectCount={category.id === activeCategory ? data.total : 0}
                    />
                  ))}
                </div>
              </div>
              
              {/* Filters */}
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isOpen={mobileFilterOpen}
                onClose={() => setMobileFilterOpen(false)}
              />
            </div>
          </div>

          {/* MAIN COLUMN: never scrolls */}
          <main className="flex-1 min-h-0 p-6 lg:p-10 lg:ml-0 mt-[8vmin] lg:pl-10 flex flex-col overflow-hidden h-[calc(100vh-1rem)]">
            {/* Fixed header - never scrolls */}
            <div className="flex-shrink-0 bg-[#121212] pb-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">
                      {currentCategory?.name}
                    </span>
                  </h1>
                  <p className="text-gray-400 text-base">
                    {currentCategory?.description}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {data.total > 0
                      ? `Found ${data.total} project${data.total === 1 ? "" : "s"}`
                      : "No projects found"}
                  </p>
                </div>

                <SearchBar
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search projects by title, description, or tech stack..."
                  className="w-full lg:w-96"
                  aria-label="Search projects"
                />
              </div>
            </div>

            {/* ONLY THE PROJECT GRID WRAPPER SCROLLS */}
            <div className="flex-1 overflow-y-auto pr-4 overscroll-contain pt-4">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <LoadingSpinner />
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="text-red-400 text-6xl mb-4" aria-hidden>
                      ⚠️
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                      onClick={handleClearFilters}
                      className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Coming Soon for Capsule Projects */}
              {activeCategory === "capsule" && !loading && !error && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center max-w-md">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Capsule Projects</h3>
                    <p className="text-gray-400 mb-6">
                      Advanced company projects are coming soon! These will be premium projects from top companies looking for expert developers.
                    </p>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <p className="text-purple-300 text-sm">
                        <strong>What to expect:</strong> High-value projects, direct company collaboration, premium compensation, and exclusive opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty */}
              {!loading && !error && data.projects.length === 0 && activeCategory !== "capsule" && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <EmptyState
                    title="No projects found"
                    description="Try adjusting your search criteria or filters to find more projects."
                    onClearFilters={handleClearFilters}
                  />
                </div>
              )}

              {/* List */}
              {!loading && !error && data.projects.length > 0 && activeCategory !== "capsule" && (
                <>
                  <div className="space-y-6 pb-6">
                    {data.projects.map((project, idx) => {
                      const isLast = idx === data.projects.length - 1;
                      return (
                        <div key={project._id} ref={isLast ? lastProjectRef : null} className="mb-1">
                          <ProjectCard project={project} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Loading More */}
                  {loadingMore && (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="small" />
                      <span className="ml-3 text-gray-400">Loading more projects...</span>
                    </div>
                  )}

                  {/* End */}
                  {!data.hasMore && data.projects.length > 0 && (
                    <div className="text-center py-12 border-t border-gray-700 mt-8">
                      <p className="text-gray-400">You've reached the end of all projects!</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Showing {data.projects.length} of {data.total} projects
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CategorizedDashboardPage;
