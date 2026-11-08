import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/(en)/page";
import BlogPage from "@/app/(en)/blog/page";
import PortugueseBlogPage from "@/app/(pt)/pt/blog/page";
import PostPage from "@/app/(en)/blog/[slug]/page";
import { experience } from "@/data/profile";
import { getPublicContent } from "@/lib/public-content";
import { formatPostDate } from "@portfolio/blog-content/format";
const { posts: [latestPost], ptPosts } = await getPublicContent();

describe("public routes", () => {
  it("renders the resume-driven home page with one primary heading", async () => {
    const { container } = render(await HomePage());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Lucas Reis de Oliveira da Silva", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From findings to decisions." })).toBeInTheDocument();
    expect(screen.getByText("Cybersecurity Engineer")).toBeInTheDocument();
    expect(screen.getByText("Application Security Engineer", { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByText("Federal University of ABC")).toBeInTheDocument();
    expect(screen.getByText("SENAI-SP")).toBeInTheDocument();
    expect(screen.getByText("Certified in Cybersecurity")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "contato@lucas-reis.com" })).toHaveAttribute("href", "mailto:contato@lucas-reis.com");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/lucasr-o");
    expect(screen.getByRole("link", { name: "X" })).toHaveAttribute("href", "https://x.com/lucasreis_lk");
    expect(screen.queryByRole("link", { name: /99610/ })).not.toBeInTheDocument();
    expect(container.querySelector("#work")).toHaveAttribute("tabindex", "-1");
  });

  it("uses the same latest post on the home page and blog index", async () => {
    const home = render(await HomePage());
    const homePreview = home.container.querySelector('section[aria-labelledby="latest-title"] article');
    expect(home.getAllByRole("link", { name: latestPost.title })[0]).toHaveAttribute("href", `/blog/${latestPost.slug}`);
    expect(within(homePreview).getByText(latestPost.summary)).toBeInTheDocument();
    expect(within(homePreview).getByText(formatPostDate(latestPost.publishedAt, "en"))).toBeInTheDocument();
    expect(within(homePreview).getByText(latestPost.readingTime)).toBeInTheDocument();
    expect(homePreview.className).toMatch(/homeFeature/);
    home.unmount();
    const blog = render(await BlogPage());
    expect(screen.getByRole("heading", { level: 1, name: "Posts." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Recent posts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: latestPost.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: latestPost.title })).toHaveAttribute("href", `/blog/${latestPost.slug}`);
    expect(blog.container.querySelector('section[aria-labelledby="articles-title"] article').className).not.toMatch(/homeFeature/);
    expect(screen.getByRole("navigation", { name: "Blog language" }).getAttribute("aria-label")).toBe("Blog language");
  });

  it("keeps each Work logo decorative beside its readable organization name", async () => {
    const { container } = render(await HomePage());
    const work = container.querySelector("#work");
    const logos = work.querySelectorAll("[data-logo] img");

    expect(logos).toHaveLength(experience.length);
    for (const [index, item] of experience.entries()) {
      expect(within(work).getByText(item.organization)).toBeInTheDocument();
      expect(decodeURIComponent(logos[index].getAttribute("src"))).toContain(item.logo.src);
      expect(logos[index]).toHaveAttribute("alt", "");
      expect(logos[index].parentElement).toHaveAttribute("data-logo", item.logo.presentation);
    }
  });

  it("renders only Portuguese-approved cards on the Portuguese index", async () => {
    render(await PortugueseBlogPage());
    expect(screen.getByRole("heading", { level: 1, name: "Artigos." })).toBeInTheDocument();
    for (const post of ptPosts) expect(screen.getByRole("heading", { level: 3, name: post.title })).toBeInTheDocument();
    if (ptPosts.length === 0) expect(screen.getByText("Ainda não há artigos em português. Novas notas aparecerão aqui.")).toBeInTheDocument();
  });

  it("renders the current article metadata, structure, and return path", async () => {
    const element = await PostPage({ params: Promise.resolve({ slug: latestPost.slug }) });
    const { container } = render(element);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(latestPost.title);
    expect(screen.getByRole("link", { name: /Back to blog/ })).toHaveAttribute("href", "/blog");
    expect(screen.getByText(latestPost.author, { exact: false })).toBeInTheDocument();
    expect(within(container.querySelector("article")).getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(0);
    expect(within(container.querySelector("article")).getByText(latestPost.summary)).toBeInTheDocument();
  });
});
