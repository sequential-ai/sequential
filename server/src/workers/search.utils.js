class UrlNormalizer {
  static normalize(rawUrl) {
    try {
      const urlObj = new URL(rawUrl);
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
      
      for (const param of trackingParams) {
        urlObj.searchParams.delete(param);
      }
      
      let canonicalUrl = urlObj.toString();
      if (canonicalUrl.endsWith('/')) {
        canonicalUrl = canonicalUrl.slice(0, -1);
      }

      return {
        canonicalUrl,
        domain: urlObj.hostname,
        protocol: urlObj.protocol,
        host: urlObj.host
      };
    } catch (e) {
      return { canonicalUrl: rawUrl, domain: '', protocol: '', host: '' };
    }
  }
}

class SourceClassifier {
  static RULES = [
    { type: 'government', pattern: (domain) => domain.endsWith('.gov') || domain.endsWith('.mil') || domain.includes('un.org') },
    { type: 'academic', pattern: (domain) => domain.endsWith('.edu') || ['arxiv.org', 'nature.com', 'acm.org', 'ieee.org'].some(d => domain.includes(d)) },
    { type: 'official', pattern: (domain) => ['anthropic.com', 'openai.com', 'mistral.ai', 'meta.com', 'google.com', 'microsoft.com', 'deepmind.com', 'huggingface.co'].some(d => domain === d || domain.endsWith('.' + d)) },
    { type: 'github', pattern: (domain) => domain === 'github.com' || domain.endsWith('.github.io') || domain === 'raw.githubusercontent.com' },
    { type: 'documentation', pattern: (domain) => domain.startsWith('docs.') || domain.startsWith('developer.') || domain.startsWith('support.') || domain.startsWith('api.') || domain.startsWith('help.') },
    { type: 'wiki', pattern: (domain) => domain.includes('wikipedia.org') || domain.includes('wikimedia.org') || domain.includes('wiktionary.org') },
    { type: 'video', pattern: (domain) => ['youtube.com', 'vimeo.com', 'dailymotion.com'].some(d => domain.includes(d)) },
    { type: 'news', pattern: (domain) => ['nytimes.com', 'bbc.com', 'bbc.co.uk', 'reuters.com', 'bloomberg.com', 'techcrunch.com', 'wsj.com', 'theguardian.com', 'cnn.com', 'cnbc.com', 'npr.org'].some(d => domain.includes(d)) },
    { type: 'community', pattern: (domain) => ['reddit.com', 'quora.com', 'stackoverflow.com', 'stackexchange.com', 'news.ycombinator.com', 'discord.com', 'twitter.com', 'x.com'].some(d => domain.includes(d)) },
    { type: 'blog', pattern: (domain) => ['medium.com', 'substack.com', 'hashnode.dev', 'dev.to'].some(d => domain.includes(d)) || domain.startsWith('blog.') || domain.includes('.blog.') },
  ];

  static classify(domain, url) {
    if (!domain) return 'community';
    const domainLower = domain.toLowerCase();

    for (const rule of this.RULES) {
      if (rule.pattern(domainLower)) {
        return rule.type;
      }
    }
    return 'community';
  }
}

class ContentTypeDetector {
  static RULES = [
    { type: 'pdf', pattern: (domain, url) => url.toLowerCase().endsWith('.pdf') },
    { type: 'repository', pattern: (domain) => domain === 'github.com' || domain === 'raw.githubusercontent.com' },
    { type: 'api', pattern: (domain) => domain.startsWith('api.') },
    { type: 'documentation', pattern: (domain) => domain.startsWith('docs.') || domain.startsWith('developer.') || domain.startsWith('support.') || domain.startsWith('help.') },
    { type: 'paper', pattern: (domain, url) => domain.includes('arxiv.org') || (url.toLowerCase().endsWith('.pdf') && SourceClassifier.classify(domain, url) === 'academic') },
    { type: 'video', pattern: (domain) => ['youtube.com', 'vimeo.com', 'dailymotion.com'].some(d => domain.includes(d)) },
    { type: 'news', pattern: (domain) => SourceClassifier.classify(domain, '') === 'news' },
  ];

  static detect(domain, url) {
    if (!domain) return 'webpage';
    const domainLower = domain.toLowerCase();

    // Check paper/pdf first as they are more specific
    if (domainLower.includes('arxiv.org')) return 'paper';
    if (url.toLowerCase().endsWith('.pdf')) {
       return SourceClassifier.classify(domainLower, url) === 'academic' ? 'paper' : 'pdf';
    }

    for (const rule of this.RULES) {
      if (rule.pattern(domainLower, url)) {
        return rule.type;
      }
    }
    return 'webpage';
  }
}

class FaviconGenerator {
  static getFavicon(domain, providerFavicon) {
    if (providerFavicon) return providerFavicon;
    if (!domain) return undefined;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }
}

module.exports = {
  UrlNormalizer,
  SourceClassifier,
  ContentTypeDetector,
  FaviconGenerator
};
