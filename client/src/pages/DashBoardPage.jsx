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

// ===== Constants =====
const ITEMS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_DELAY = 500;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
const useQueryKey = (search, filters, page) =>
  useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(ITEMS_PER_PAGE));
    if (search) params.set("search", search);
    if (filters.techStack) params.set("techStack", filters.techStack);
    if (filters.budget) params.set("budget", filters.budget);
    if (filters.contributor) params.set("contributor", filters.contributor);
    return params.toString();
  }, [search, filters.techStack, filters.budget, filters.contributor, page]);

// ===== Data Hook (infinite projects) =====
const useInfiniteProjects = (searchTerm, filters) => {
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
  }, [searchTerm, filters.techStack, filters.budget, filters.contributor]);

  const queryKeyInitial = useQueryKey(searchTerm, filters, 1);

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

  const queryKeyMore = useQueryKey(searchTerm, filters, page);

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

// ===== Page =====
const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

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

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    filters.techStack,
    filters.budget,
    filters.contributor,
    searchParams,
    setSearchParams,
  ]);

  // Data
  const { data, loading, loadingMore, error, loadMore } = useInfiniteProjects(
    debouncedSearch,
    filters
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

  return (
    <ErrorBoundary>
      {/* dvh prevents mobile browser chrome from squashing height; use min-h-screen if dvh not available */}
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
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isOpen={mobileFilterOpen}
              onClose={() => setMobileFilterOpen(false)}
            />
          </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               {/* MAIN COLUMN: never scrolls */}
                <main className="flex-1 min-h-0 p-6 lg:p-10 lg:ml-0 mt-[8vmin] lg:pl-10 flex flex-col overflow-hidden h-[calc(100vh-1rem)]">
                             {/* Fixed header - never scrolls */}
               <div className="flex-shrink-0 bg-[#121212] pb-10">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white ">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">
                        Explore
                      </span>{" "}
                      Projects
                    </h1>
                    <p className="text-gray-400 text-base">
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

              {/* Empty */}
              {!loading && !error && data.projects.length === 0 && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <EmptyState
                    title="No projects found"
                    description="Try adjusting your search criteria or filters to find more projects."
                    onClearFilters={handleClearFilters}
                  />
                </div>
              )}

              {/* List */}
              {!loading && !error && data.projects.length > 0 && (
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

export default DashboardPage;
