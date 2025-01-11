import BottomNav from './components/atoms/BottomNav'
import ShoppingList from './page/ShoppingList'

function App() {
  return (
    <div className="w-full max-w-lg flex flex-col items-center m-auto gap-3">
      <h1 className="font-bold text-2xl mt-4">Plateful</h1>
      <ShoppingList />
      <BottomNav />
    </div>
  )
}

export default App
