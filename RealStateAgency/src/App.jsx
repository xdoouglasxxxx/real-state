import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import PropertySearch from "@/pages/PropertySearch";
import PropertyDetail from "@/pages/PropertyDetail";
import Sell from "@/pages/Sell";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import BlogDetail from "@/pages/BlogDetail";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Accessibility from "@/pages/Accessibility";
import PageNotFound from "@/lib/PageNotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/imoveis" element={<PropertySearch />} />
        <Route path="/imovel/:id" element={<PropertyDetail />} />
        <Route path="/vender" element={<Sell />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/acessibilidade" element={<Accessibility />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
}
