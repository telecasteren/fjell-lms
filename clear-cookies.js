// Manual cookie clearing script for testing
// Run this in browser console to clear NextAuth cookies

function clearNextAuthCookies() {
  const cookies = [
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.csrf-token',
  ];
  
  cookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
  });
  
  console.log('NextAuth cookies cleared!');
  window.location.reload();
}

// Run the function
clearNextAuthCookies();
